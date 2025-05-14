import Decimal from 'decimal.js';
import { IHandleOrderMatchedParams } from 'src/common/interfaces/orders/handle-orders-matched-params.interface';
import { OrderStatus } from '@prisma/client';
import { UpdateOrderDto } from 'src/common/dto/orders/update-order.dto';
import { UseCaseCreateOrderDto } from 'src/common/dto/orders/create-order.dto';
import { formatUnits } from 'ethers';

export async function handleOrderMatchedEvent({
  orderMatched,
  getOrderInfo,
  getTokenDecimals,
  createOrder,
  updateOrder,
  logger = console,
  retryLimit = 3,
}: IHandleOrderMatchedParams): Promise<void> {
  try {
    const orderId = orderMatched.id.toString();
    const orderInfo = await getOrderInfo(orderId);

    const [buyDecimals, sellDecimals] = await Promise.all([
      getTokenDecimals(orderInfo.tokenA),
      getTokenDecimals(orderInfo.tokenB),
    ]);

    const amountPaid = new Decimal(
      formatUnits(orderMatched.amountPaid, buyDecimals),
    );
    const amountReceived = new Decimal(
      formatUnits(orderMatched.amountReceived, sellDecimals),
    );

    const status =
      Number(orderMatched.amountLeftToFill) === 0
        ? OrderStatus.FILLED
        : OrderStatus.PARTIALLY_FILLED;

    const updateDto: UpdateOrderDto = {
      orderId,
      buyAmountFilled: amountPaid,
      sellAmountFilled: amountReceived,
      status,
    };

    async function tryCreateOrder(): Promise<void> {
      const createDto: UseCaseCreateOrderDto = {
        orderId,
        buyToken: orderInfo.tokenA,
        sellToken: orderInfo.tokenB,
        buyAmount: new Decimal(formatUnits(orderInfo.amountA, buyDecimals)),
        sellAmount: new Decimal(formatUnits(orderInfo.amountB, sellDecimals)),
        userId: orderInfo.user,
        isMarketOrder: orderInfo.isMarket,
      };

      try {
        await createOrder(createDto);
        logger.log('Created new order');
      } catch (createError) {
        const isOrderExistsError =
          createError?.response?.message === 'Order already exists' ||
          (createError?.code === 'P2002' &&
            createError?.meta?.target?.includes('orderId'));

        if (isOrderExistsError) {
          logger.warn(`Order ${orderId} already exists, will retry update`);
        } else {
          throw createError;
        }
      }
    }

    function delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function tryUpdateWithRetry(
      updateDto: UpdateOrderDto,
    ): Promise<void> {
      for (let attempt = 0; attempt < retryLimit; attempt++) {
        try {
          const updatedOrder = await updateOrder(updateDto);
          logger.log('OrderMatched: Updated order', updatedOrder);
          return;
        } catch (error) {
          if (error?.response?.message !== 'Order not found') {
            throw error;
          }

          if (attempt === 0) {
            await tryCreateOrder();
          }

          await delay(100 * (attempt + 1));
        }
      }

      logger.warn(
        `Failed to update order ${orderId} after ${retryLimit} attempts`,
      );
    }

    await tryUpdateWithRetry(updateDto);
  } catch (e) {
    logger.error('Error in handleOrderMatchedEvent:', e);
  }
}
