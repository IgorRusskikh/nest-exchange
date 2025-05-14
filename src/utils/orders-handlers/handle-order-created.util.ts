import Decimal from 'decimal.js';
import { UseCaseCreateOrderDto } from 'src/common/dto/orders/create-order.dto';
import { formatUnits } from 'ethers';

interface IHandleOrderCreatedParams {
  order: {
    id: any;
    tokenA: string;
    tokenB: string;
    amountA: any;
    amountB: any;
    user: string;
    isMarket: boolean;
  };
  getTokenDecimals: (tokenAddress: string) => Promise<number>;
  createOrder: (data: UseCaseCreateOrderDto) => Promise<any>;
  logger?: Console;
}

export async function handleOrderCreatedEvent({
  order,
  getTokenDecimals,
  createOrder,
  logger = console,
}: IHandleOrderCreatedParams): Promise<void> {
  try {
    const [buyTokenDecimals, sellTokenDecimals] = await Promise.all([
      getTokenDecimals(order.tokenA),
      getTokenDecimals(order.tokenB),
    ]);

    const dataToCreateOrder: UseCaseCreateOrderDto = {
      orderId: order.id.toString(),
      buyToken: order.tokenA,
      sellToken: order.tokenB,
      buyAmount: new Decimal(formatUnits(order.amountA, buyTokenDecimals)),
      sellAmount: new Decimal(formatUnits(order.amountB, sellTokenDecimals)),
      userId: order.user,
      isMarketOrder: order.isMarket,
    };

    const newOrder = await createOrder(dataToCreateOrder);

    logger.log('New order created', newOrder.id);
  } catch (error) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes('orderId')) {
      logger.warn(`Order ${order.id} already exists, skipping creation`);
    } else {
      logger.error('Error on OrderCreated:', error);
    }
  }
}
