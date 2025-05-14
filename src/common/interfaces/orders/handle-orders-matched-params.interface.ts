import { IOrderInfo } from './blockchain-order-info.interface';
import { IOrderMatchedEvent } from './blockchain-order-match.interface';
import { UpdateOrderDto } from 'src/common/dto/orders/update-order.dto';
import { UseCaseCreateOrderDto } from 'src/common/dto/orders/create-order.dto';

export interface IHandleOrderMatchedParams {
  orderMatched: IOrderMatchedEvent;
  getOrderInfo: (orderId: string) => Promise<IOrderInfo>;
  getTokenDecimals: (tokenAddress: string) => Promise<number>;
  createOrder: (dto: UseCaseCreateOrderDto) => Promise<any>;
  updateOrder: (dto: UpdateOrderDto) => Promise<any>;
  logger?: typeof console;
  retryLimit?: number;
}
