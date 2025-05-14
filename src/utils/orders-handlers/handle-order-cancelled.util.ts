import Decimal from 'decimal.js';
import { IOrderInfo } from 'src/common/interfaces/orders/blockchain-order-info.interface';
import { OrderStatus } from '@prisma/client';
import { UseCaseCreateOrderDto } from 'src/common/dto/orders/create-order.dto';
import { formatUnits } from 'ethers';

interface IHandleOrderCancelledParams {
  orderId: bigint;
  cancelOrder: (orderId: string) => Promise<any>;
  getOrderInfo?: (orderId: string | bigint) => Promise<IOrderInfo>;
  getTokenDecimals?: (tokenAddress: string) => Promise<number>;
  createOrder?: (data: UseCaseCreateOrderDto) => Promise<any>;
  logger?: Console;
}

export async function handleOrderCancelledEvent({
  orderId,
  cancelOrder,
  getOrderInfo,
  getTokenDecimals,
  createOrder,
  logger = console,
}: IHandleOrderCancelledParams): Promise<void> {
  try {
    const orderIdStr = orderId.toString();

    try {
      await cancelOrder(orderIdStr);
      logger.log(`Order ${orderIdStr} cancelled successfully`);
    } catch (error) {
      if (
        error?.response?.message === 'Order not found' &&
        getOrderInfo &&
        createOrder &&
        getTokenDecimals
      ) {
        logger.log(
          `Order ${orderIdStr} not found, creating it as cancelled...`,
        );

        try {
          const orderInfo = await getOrderInfo(orderId);

          const [buyDecimals, sellDecimals] = await Promise.all([
            getTokenDecimals(orderInfo.tokenA),
            getTokenDecimals(orderInfo.tokenB),
          ]);

          const createDto: UseCaseCreateOrderDto = {
            orderId: orderIdStr,
            buyToken: orderInfo.tokenA,
            sellToken: orderInfo.tokenB,
            buyAmount: new Decimal(formatUnits(orderInfo.amountA, buyDecimals)),
            sellAmount: new Decimal(
              formatUnits(orderInfo.amountB, sellDecimals),
            ),
            userId: orderInfo.user,
            isMarketOrder: orderInfo.isMarket,
            status: OrderStatus.CANCELLED,
          };

          await createOrder(createDto);
          logger.log(`Order ${orderIdStr} created with CANCELLED status`);
        } catch (createError) {
          logger.error(
            `Error creating cancelled order ${orderIdStr}:`,
            createError,
          );
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error(`Error handling order cancellation for ${orderId}:`, error);
  }
}
