import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';

import { OrdersUseCase } from 'src/app/use-case/orders/orders.use-case';
import { ORDER_CONTROLLER_CONTRACT } from 'src/infrastructure/config/contracts/order-controller.contract';
import { handleOrderMatchedEvent } from 'src/utils/orders-handlers/handle-order-matched.util';
import { BlockchainTokenService } from '../blockchain-token/blockchain-token.service';
import { handleOrderCreatedEvent } from 'src/utils/orders-handlers/handle-order-created.util';
import { getOrderInfoFromBlockchain } from 'src/utils/orders-handlers/get-order-info.util';
import { handleOrderCancelledEvent } from 'src/utils/orders-handlers/handle-order-cancelled.util';
import { IBlockchainOrder } from 'src/common/interfaces/orders/blockchain-order.interface';
import { IOrderMatchedEvent } from 'src/common/interfaces/orders/blockchain-order-match.interface';
import { IOrderInfo } from 'src/common/interfaces/orders/blockchain-order-info.interface';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private contract: ethers.Contract;

  constructor(
    private readonly blockchainTokenService: BlockchainTokenService,
    @Inject('ETHERS_PROVIDER') private readonly provider: ethers.Provider,
    private readonly ordersUseCase: OrdersUseCase,
  ) {}

  async onModuleInit() {
    this.contract = new ethers.Contract(
      ORDER_CONTROLLER_CONTRACT.address,
      ORDER_CONTROLLER_CONTRACT.abi,
      this.provider,
    );

    console.log('listening...');

    this.listenToEvents();
  }

  async getProvider(): Promise<ethers.Provider> {
    return this.provider;
  }

  async getContract(): Promise<ethers.Contract> {
    return this.contract;
  }

  async listenToEvents(): Promise<void> {
    this.contract.on(
      'OrderCreated',
      async (id, amountA, amountB, tokenA, tokenB, user, isMarket) => {
        const order: IBlockchainOrder = {
          id,
          tokenA,
          tokenB,
          amountA,
          amountB,
          user,
          isMarket,
        };

        await handleOrderCreatedEvent({
          order,
          getTokenDecimals: this.blockchainTokenService.getTokenDecimals.bind(
            this.blockchainTokenService,
          ),
          createOrder: this.ordersUseCase.createOrder.bind(this.ordersUseCase),
        });
      },
    );

    this.contract.on(
      'OrderMatched',
      async (
        id,
        matchedId,
        amountReceived,
        amountPaid,
        amountLeftToFill,
        fee,
        feeRate,
      ) => {
        const orderMatched: IOrderMatchedEvent = {
          id,
          matchedId,
          amountReceived,
          amountPaid,
          amountLeftToFill,
          fee,
          feeRate,
        };

        await handleOrderMatchedEvent({
          orderMatched,
          getOrderInfo: this.getOrderInfo.bind(this),
          getTokenDecimals: this.blockchainTokenService.getTokenDecimals.bind(
            this.blockchainTokenService,
          ),
          createOrder: this.ordersUseCase.createOrder.bind(this.ordersUseCase),
          updateOrder: this.ordersUseCase.updateOrder.bind(this.ordersUseCase),
        });
      },
    );

    this.contract.on('OrderCancelled', async (orderId: bigint) => {
      await handleOrderCancelledEvent({
        orderId,
        cancelOrder: this.ordersUseCase.cancelOrder.bind(this.ordersUseCase),
        getOrderInfo: this.getOrderInfo.bind(this),
        getTokenDecimals: this.blockchainTokenService.getTokenDecimals.bind(
          this.blockchainTokenService,
        ),
        createOrder: this.ordersUseCase.createOrder.bind(this.ordersUseCase),
      });
    });
  }

  async getOrderIdLength(): Promise<bigint> {
    return this.contract.getOrderIdLength();
  }

  async getOrderId(index: number): Promise<bigint> {
    return this.contract.getOrderId(index);
  }

  async getOrderInfo(orderId: string): Promise<IOrderInfo> {
    return getOrderInfoFromBlockchain({
      orderId,
      contract: this.contract,
    });
  }
}
