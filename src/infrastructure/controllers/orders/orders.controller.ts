import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseBoolPipe,
  Query,
} from '@nestjs/common';
import { OrdersUseCase } from 'src/app/use-case/orders/orders.use-case';
import { GetOrderBookDto } from 'src/common/dto/orders/get-orderbook.dto';
import { MatchOrderDto } from 'src/common/dto/orders/match-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersUseCase: OrdersUseCase) {}

  @Get()
  getOrderBook(
    @Query() getOrderBookDto: GetOrderBookDto,
    @Query('active', new DefaultValuePipe(false), ParseBoolPipe)
    active: boolean,
  ) {
    return this.ordersUseCase.getOrderBook({
      ...getOrderBookDto,
      active,
    });
  }

  @Get('get-matching')
  getMatchingOrders(@Query() matchOrderDto: MatchOrderDto) {
    return this.ordersUseCase.getMatchingOrders(matchOrderDto);
  }
}
