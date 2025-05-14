const pLimit = require('p-limit');

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrderStatus, Prisma, User } from '@prisma/client';

import { BlockchainService } from 'src/infrastructure/services/blockchain/blockchain.service';
import { BlockchainTokenService } from 'src/infrastructure/services/blockchain-token/blockchain-token.service';
import { IOrderInfo } from 'src/common/interfaces/orders/blockchain-order-info.interface';
import { OrdersService } from 'src/infrastructure/services/orders/orders.service';
import { UsersService } from 'src/infrastructure/services/users/users.service';
import { formatUnits } from 'ethers';

@Injectable()
export class BlockchainUseCase implements OnModuleInit {
  private readonly chunkSizeForBlockchain = 5;
  private readonly logger = new Logger(BlockchainUseCase.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly orderService: OrdersService,
    private readonly blockchainTokenService: BlockchainTokenService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    this.logger.log('[Init] Start restoreOrdersHistory');
    await this.restoreOrdersHistory();
    this.logger.log('[Init] End restoreOrdersHistory');
  }

  private async retry<T>(
    fn: () => Promise<T>,
    context: string,
    retries = 3,
    initialDelay = 10000,
    backoffFactor = 2,
  ): Promise<T> {
    let delay = initialDelay;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        const errorMessage = err.message || err.toString();
        this.logger.warn(
          `[${context}] Attempt ${i + 1}/${retries} failed: ${errorMessage}. Waiting ${delay}ms before next attempt.`,
        );
        if (i === retries - 1) {
          this.logger.error(
            `[${context}] All ${retries} attempts failed. Error: ${errorMessage}`,
          );
          throw err;
        }
        await new Promise((r) => setTimeout(r, delay));
        delay *= backoffFactor;
      }
    }
    throw new Error(
      `[${context}] Retry logic finished unexpectedly. This should not happen.`,
    );
  }

  private async executeStageWithRetries<T>(
    stageFn: () => Promise<T>,
    stageName: string,
    stageRetries = 3,
    stageFixedDelay = 5000,
  ): Promise<T> {
    for (let i = 0; i < stageRetries; i++) {
      try {
        this.logger.log(
          `Starting stage: ${stageName}, attempt ${i + 1}/${stageRetries}`,
        );
        const result = await stageFn();
        this.logger.log(
          `Stage ${stageName} (attempt ${i + 1}/${stageRetries}) completed successfully.`,
        );
        return result;
      } catch (err) {
        const errorMessage = err.message || err.toString();
        this.logger.warn(
          `Stage ${stageName} attempt ${i + 1}/${stageRetries} failed: ${errorMessage}.`,
        );
        if (i === stageRetries - 1) {
          this.logger.error(
            `All ${stageRetries} attempts failed for stage ${stageName}. Error: ${errorMessage}`,
          );
          const wrappedError = new Error(
            `Stage '${stageName}' failed after ${stageRetries} attempts. Last error: ${errorMessage}`,
          );
          if (err.stack) {
            wrappedError.stack = `Original stack: ${err.stack}`;
          }
          throw wrappedError;
        }
        this.logger.log(
          `Waiting ${stageFixedDelay}ms before retrying stage ${stageName}.`,
        );
        await new Promise((r) => setTimeout(r, stageFixedDelay));
      }
    }
    throw new Error(
      `Stage '${stageName}' retry logic finished unexpectedly after ${stageRetries} attempts. This should not happen.`,
    );
  }

  private async getMissingOrderIds(
    total: number,
    existingOrderIds: Set<string>,
  ): Promise<string[]> {
    const limit = pLimit(this.chunkSizeForBlockchain);
    const results: string[] = [];

    for (let i = 0; i < total; i += this.chunkSizeForBlockchain) {
      const indexes = Array.from(
        { length: Math.min(this.chunkSizeForBlockchain, total - i) },
        (_, j) => i + j,
      );

      const chunkIds = await Promise.all(
        indexes.map((index) =>
          limit(() =>
            this.retry(
              () => this.blockchainService.getOrderId(index),
              `getOrderId for index ${index}`,
            ),
          ),
        ),
      );

      const missing = chunkIds
        .map((id) => id.toString())
        .filter((id) => !existingOrderIds.has(id));

      results.push(...missing);
      this.logger.log(
        `Checked ${i + indexes.length}/${total}, found ${missing.length} missing`,
      );
      await new Promise((r) => setTimeout(r, 1000));
    }

    return results;
  }

  private async fetchOrdersInfo(orderIds: string[]): Promise<IOrderInfo[]> {
    const results: IOrderInfo[] = [];
    this.logger.log(
      `[fetchOrdersInfo] Starting to fetch info for ${orderIds.length} orders in chunks of ${this.chunkSizeForBlockchain}.`,
    );
    for (let i = 0; i < orderIds.length; i += this.chunkSizeForBlockchain) {
      const chunk = orderIds.slice(i, i + this.chunkSizeForBlockchain);
      this.logger.log(
        `[fetchOrdersInfo] Fetching chunk ${Math.floor(i / this.chunkSizeForBlockchain) + 1}/${Math.ceil(orderIds.length / this.chunkSizeForBlockchain)} for ${chunk.length} order IDs.`,
      );

      const ordersInChunk = await Promise.all(
        chunk.map((id) =>
          this.retry(
            () => this.blockchainService.getOrderInfo(id),
            `getOrderInfo for id ${id}`,
          ),
        ),
      );

      results.push(...ordersInChunk);

      this.logger.log(
        `[fetchOrdersInfo] Fetched ${ordersInChunk.length} orders in this chunk. Total fetched so far: ${results.length}/${orderIds.length}.`,
      );

      if (i + this.chunkSizeForBlockchain < orderIds.length) {
        this.logger.log(
          `[fetchOrdersInfo] Waiting 5 seconds before fetching the next chunk...`,
        );
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    this.logger.log(
      `[fetchOrdersInfo] Finished. Fetched total ${results.length} order infos.`,
    );
    return results;
  }

  private async fetchTokenDecimals(
    tokens: Set<string>,
  ): Promise<Record<string, number>> {
    const tokenList = Array.from(tokens);
    const decimalsMap: Record<string, number> = {};

    for (let i = 0; i < tokenList.length; i += this.chunkSizeForBlockchain) {
      const chunk = tokenList.slice(i, i + this.chunkSizeForBlockchain);
      const decimals = await Promise.all(
        chunk.map((token) =>
          this.retry(
            () => this.blockchainTokenService.getTokenDecimals(token),
            `getTokenDecimals for token ${token}`,
          ),
        ),
      );

      chunk.forEach((token, index) => {
        decimalsMap[token] = decimals[index];
      });
    }

    return decimalsMap;
  }

  async restoreOrdersHistory() {
    try {
      this.logger.log('Starting restoreOrdersHistory process.');

      const length = await this.executeStageWithRetries(async () => {
        const rawLength = await this.blockchainService.getOrderIdLength();
        const numLength = Number(rawLength);
        if (isNaN(numLength) || !isFinite(numLength)) {
          this.logger.error(
            `Invalid orderIdLength received: ${rawLength}. Cannot proceed.`,
          );
          throw new Error(`Invalid orderIdLength received: ${rawLength}`);
        }
        return numLength;
      }, 'fetching orderIdLength');
      this.logger.log(`Total order count on chain: ${length}`);

      if (length === 0) {
        this.logger.log('No orders on chain. Exiting restoreOrdersHistory.');
        return;
      }

      const existingOrders = await this.orderService.getOrdersWithFilters(
        undefined,
        { orderId: true },
      );
      const existingOrderIds = new Set(existingOrders.map((o) => o.orderId));
      this.logger.log(`Existing orders in DB: ${existingOrderIds.size}`);

      if (existingOrderIds.size >= length) {
        this.logger.log(
          'All orders from blockchain already exist in DB or DB has more orders. Exiting restoreOrdersHistory.',
        );
        return;
      }

      const missingOrderIds = await this.executeStageWithRetries(
        () => this.getMissingOrderIds(length, existingOrderIds),
        'calculating missing order IDs',
      );
      this.logger.log(`Missing orders to restore: ${missingOrderIds.length}`);

      if (missingOrderIds.length === 0) {
        this.logger.log(
          'No missing orders to restore. Exiting restoreOrdersHistory.',
        );
        return;
      }

      const ordersInfo = await this.executeStageWithRetries(
        () => this.fetchOrdersInfo(missingOrderIds),
        'fetching missing orders info',
      );
      this.logger.log(`Fetched ${ordersInfo.length} order infos`);

      if (ordersInfo.length === 0 && missingOrderIds.length > 0) {
        this.logger.warn(
          `Expected to fetch info for ${missingOrderIds.length} orders, but received 0. Check blockchain service or contract state.`,
        );
      }

      const uniqueTokens = new Set<string>();
      ordersInfo.forEach((order) => {
        if (order && order.tokenA && order.tokenB) {
          uniqueTokens.add(order.tokenA);
          uniqueTokens.add(order.tokenB);
        } else {
          this.logger.warn(
            'Encountered an order with missing tokenA or tokenB fields during unique token collection.',
          );
        }
      });

      if (uniqueTokens.size === 0) {
        this.logger.log(
          'No unique tokens found in fetched orders. Skipping fetchTokenDecimals.',
        );

        if (ordersInfo.length > 0) {
          this.logger.warn(
            'Orders info was fetched, but no valid unique tokens were extracted.',
          );
        }
        console.log({});
        this.logger.log('restoreOrdersHistory completed.');
        return;
      }

      const tokensDecimals = await this.executeStageWithRetries(
        () => this.fetchTokenDecimals(uniqueTokens),
        'fetching token decimals',
      );
      this.logger.log(
        `Fetched decimals for ${Object.keys(tokensDecimals).length} tokens out of ${uniqueTokens.size} unique tokens requested.`,
      );
      console.log(tokensDecimals);

      this.logger.log(
        '[Restore Orders] Starting processing of users and orders from fetched blockchain data...',
      );

      this.logger.log(
        '[Restore Orders] Step 1: Processing users from orders...',
      );
      const userAddressesFromOrders = new Set<string>();

      if (ordersInfo.length > 0) {
        this.logger.log(
          '[Restore Orders] Structure of the first orderInfo object:',
          JSON.stringify(
            ordersInfo[0],
            (key, value) =>
              typeof value === 'bigint' ? value.toString() : value,
            2,
          ),
        );
      }

      let loggedFirstProblematicOrder = false;

      ordersInfo.forEach((order, idx) => {
        const orderData = order as any;

        if (orderData && orderData.user && typeof orderData.user === 'string') {
          userAddressesFromOrders.add(orderData.user.toLowerCase());
        } else {
          this.logger.warn(
            `[Restore Orders] OrderInfo (index ${idx}) missing or has invalid user address. Expected 'user' field. Current orderId (from orderData.id): '${orderData?.id || 'N/A'}'. UserAddress (from orderData.user): '${orderData?.user || 'N/A'}'. Full OrderData (logging only first problematic one for brevity in repeated errors):`,
            !loggedFirstProblematicOrder
              ? JSON.stringify(
                  orderData,
                  (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value,
                  2,
                )
              : '(Structure logged for first problematic order)',
          );
          if (!loggedFirstProblematicOrder) {
            loggedFirstProblematicOrder = true;
          }
        }
      });

      const createdOrFetchedUsersMap = new Map<string, User>();
      if (userAddressesFromOrders.size > 0) {
        this.logger.log(
          `[Restore Orders] Found ${userAddressesFromOrders.size} unique user addresses to process.`,
        );
        for (const address of Array.from(userAddressesFromOrders)) {
          try {
            const user = await this.usersService.getOrCreate(address);
            createdOrFetchedUsersMap.set(address, user as User);
            this.logger.log(
              `[Restore Orders] Successfully processed user: ${address}, DB ID: ${(user as any).id || user.address}`,
            );
          } catch (err) {
            const errorMessage = err.message || err.toString();
            this.logger.error(
              `[Restore Orders] Failed to get/create user ${address}: ${errorMessage}`,
              err.stack,
            );
            continue;
          }
        }
        this.logger.log(
          `[Restore Orders] User processing finished. Successfully processed ${createdOrFetchedUsersMap.size} of ${userAddressesFromOrders.size} unique addresses.`,
        );
      } else {
        this.logger.log(
          '[Restore Orders] No unique user addresses found in orders to process.',
        );
      }

      this.logger.log('[Restore Orders] Step 2: Creating orders in DB...');
      let ordersAttempted = 0;
      let ordersSuccessfullyCreated = 0;
      let ordersSkippedExisting = 0;
      let ordersSkippedMissingUser = 0;
      let ordersSkippedInvalidData = 0;

      if (ordersInfo.length > 0) {
        for (const orderInfo of ordersInfo) {
          ordersAttempted++;

          const typedOrderInfo: IOrderInfo = orderInfo;

          if (
            !typedOrderInfo ||
            !typedOrderInfo.id ||
            !typedOrderInfo.user ||
            typeof typedOrderInfo.user !== 'string' ||
            !typedOrderInfo.tokenA ||
            !typedOrderInfo.tokenB
          ) {
            this.logger.warn(
              `[Restore Orders] Skipping order creation due to missing/invalid critical fields (id, user, tokenA, tokenB) in OrderInfo.`,
              { orderId: typedOrderInfo?.id },
            );
            ordersSkippedInvalidData++;
            continue;
          }

          const userAddressLower = typedOrderInfo.user.toLowerCase();
          const user = createdOrFetchedUsersMap.get(userAddressLower);

          if (!user) {
            this.logger.warn(
              `[Restore Orders] Skipping order ${typedOrderInfo.id} because user ${typedOrderInfo.user} was not found or failed to process.`,
            );
            ordersSkippedMissingUser++;
            continue;
          }

          try {
            const existingOrder = await this.orderService.getOrderByOrderId(
              typedOrderInfo.id.toString(),
            );
            if (existingOrder) {
              this.logger.log(
                `[Restore Orders] Order ${typedOrderInfo.id} already exists in DB (ID: ${(existingOrder as any).id}). Skipping creation.`,
              );
              ordersSkippedExisting++;
              continue;
            }

            const createOrderDto: Prisma.OrderCreateInput = {
              orderId: typedOrderInfo.id.toString(),
              user: { connect: { address: user.address } },
              buyToken: typedOrderInfo.tokenA,
              sellToken: typedOrderInfo.tokenB,
              buyAmount: new Prisma.Decimal(
                formatUnits(
                  typedOrderInfo.amountA?.toString() || '0',
                  tokensDecimals[typedOrderInfo.tokenA] ?? 18,
                ),
              ),
              sellAmount: new Prisma.Decimal(
                formatUnits(
                  typedOrderInfo.amountB?.toString() || '0',
                  tokensDecimals[typedOrderInfo.tokenB] ?? 18,
                ),
              ),
              sellAmountFilled: new Prisma.Decimal(
                formatUnits(
                  typedOrderInfo.amountFilledB?.toString() || '0',
                  tokensDecimals[typedOrderInfo.tokenB] ?? 18,
                ),
              ),
              buyAmountFilled: new Prisma.Decimal(
                formatUnits(
                  typedOrderInfo.amountFilledA?.toString() || '0',
                  tokensDecimals[typedOrderInfo.tokenA] ?? 18,
                ),
              ),
              isMarketOrder:
                typedOrderInfo.isMarket !== undefined
                  ? typedOrderInfo.isMarket
                  : false,

              status:
                typedOrderInfo.amountFilledA?.toString() ===
                  typedOrderInfo.amountA?.toString() ||
                typedOrderInfo.amountFilledB?.toString() ===
                  typedOrderInfo.amountB?.toString()
                  ? OrderStatus.FILLED
                  : (typedOrderInfo.amountFilledB > 0 &&
                        typedOrderInfo.amountFilledB <
                          typedOrderInfo.amountB) ||
                      (typedOrderInfo.amountFilledA > 0 &&
                        typedOrderInfo.amountFilledA < typedOrderInfo.amountA)
                    ? OrderStatus.PARTIALLY_FILLED
                    : OrderStatus.ACTIVE,
            };

            if (
              typedOrderInfo.amountA === undefined ||
              typedOrderInfo.amountA === null
            ) {
              this.logger.warn(
                `[Restore Orders] amountA (for sellAmount) is missing for order ${typedOrderInfo.id}. Using 0.`,
              );
            }
            if (
              typedOrderInfo.amountB === undefined ||
              typedOrderInfo.amountB === null
            ) {
              this.logger.warn(
                `[Restore Orders] amountB (for sellAmount) is missing for order ${typedOrderInfo.id}. Using 0.`,
              );
            }
            if (typedOrderInfo.isMarket === undefined) {
              this.logger.warn(
                `[Restore Orders] isMarketOrder is missing for order ${typedOrderInfo.id}. Defaulting to false.`,
              );
            }

            await this.orderService.createOrder(createOrderDto);
            ordersSuccessfullyCreated++;
            const logAddress = user ? user.address : userAddressLower;
            this.logger.log(
              `[Restore Orders] Successfully created order ${typedOrderInfo.id} for user ${logAddress} (DB User ID: ${(user as any).id || 'N/A'}).`,
            );
          } catch (err) {
            const errorMessage = err.message || err.toString();
            const logAddress = user ? user.address : userAddressLower;
            this.logger.error(
              `[Restore Orders] Failed to create order ${typedOrderInfo.id} for user ${logAddress}: ${errorMessage}`,
              { stack: err.stack, orderInfoData: typedOrderInfo },
            );
          }
        }
        this.logger.log(
          `[Restore Orders] Order creation step finished. Summary: Attempted=${ordersAttempted}, SuccessfullyCreated=${ordersSuccessfullyCreated}, SkippedExisting=${ordersSkippedExisting}, SkippedMissingUser=${ordersSkippedMissingUser}, SkippedInvalidData=${ordersSkippedInvalidData}.`,
        );
      } else {
        this.logger.log(
          '[Restore Orders] No orders info fetched from blockchain to process for DB creation.',
        );
      }

      this.logger.log(
        'restoreOrdersHistory process (including user and order persistence) completed successfully.',
      );

      this.logger.log('Starting processing OrderCancelled events');
      try {
        const contract = await this.blockchainService.getContract();
        const filter = contract.filters.OrderCancelled();
        const logs = await contract.queryFilter(filter, 0, 'latest');

        this.logger.log(`Получено ${logs.length} логов OrderCancelled`);

        for (const log of logs) {
          try {
            const orderId = log.data ? BigInt(log.data).toString() : null;

            if (!orderId) {
              this.logger.warn('Получен лог без orderId, пропускаем');
              continue;
            }

            await this.orderService.updateOrderByOrderId(orderId, {
              status: OrderStatus.CANCELLED,
            });

            this.logger.log(`Order ${orderId} was cancelled and updated in DB`);
          } catch (error) {
            this.logger.error(
              `Error processing log for order: ${error.message}`,
            );
          }
        }

        this.logger.log(
          'OrderCancelled logs processing completed successfully.',
        );
      } catch (error) {
        this.logger.error(
          `Error processing OrderCancelled logs: ${error.message}`,
          error.stack,
        );
      }
    } catch (error) {
      const errorMessage = error.message || error.toString();
      this.logger.error(
        `Critical error during restoreOrdersHistory: ${errorMessage}`,
        error.stack,
      );
      throw error;
    }
  }
}
