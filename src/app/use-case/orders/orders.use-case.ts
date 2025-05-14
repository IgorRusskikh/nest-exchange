import { BadRequestException, Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';

import { GetOrderBookDto } from 'src/common/dto/orders/get-orderbook.dto';
import { MatchOrderDto } from 'src/common/dto/orders/match-order.dto';
import { OrdersService } from 'src/infrastructure/services/orders/orders.service';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.persistence';
import { UpdateOrderDto } from 'src/common/dto/orders/update-order.dto';
import { UseCaseCreateOrderDto } from 'src/common/dto/orders/create-order.dto';
import { UsersService } from 'src/infrastructure/services/users/users.service';

@Injectable()
export class OrdersUseCase {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  async getOrderBook(getOrderBookDto: GetOrderBookDto): Promise<Order[]> {
    const { buyToken, sellToken, user, active } = getOrderBookDto;

    console.log('userAddress', user);
    console.log('buyToken', buyToken);
    console.log('sellToken', sellToken);
    console.log('active', active);

    const orders = await this.ordersService.getOrdersWithFilters(
      {
        buyToken,
        sellToken,
        user: {
          address: user,
        },
        status: active
          ? {
              in: [OrderStatus.ACTIVE, OrderStatus.PARTIALLY_FILLED],
            }
          : undefined,
      },
      {
        orderId: true,
        buyToken: true,
        sellToken: true,
        buyAmount: true,
        sellAmount: true,
        buyAmountFilled: true,
        sellAmountFilled: true,
        isMarketOrder: true,
        status: true,
        createdAt: true,
      },
    );

    return orders;
  }

  async createOrder(createOrderDto: UseCaseCreateOrderDto) {
    const { userId, ...dataToCreateOrder } = createOrderDto;
    let user = await this.usersService.getOrCreate(userId);

    const existingOrder = await this.ordersService.getOrderByOrderId(
      createOrderDto.orderId,
    );

    if (existingOrder) {
      throw new BadRequestException('Order already exists');
    }

    const order = await this.ordersService.createOrder({
      ...dataToCreateOrder,
      user: {
        connect: {
          address: user.address,
        },
      },
    });

    return order;
  }

  async updateOrder(updateOrderDto: UpdateOrderDto) {
    const existingOrder = await this.ordersService.getOrderByOrderId(
      updateOrderDto.orderId,
    );

    if (!existingOrder) {
      throw new BadRequestException('Order not found');
    }

    const updatedOrder = await this.ordersService.updateOrderByOrderId(
      updateOrderDto.orderId,
      updateOrderDto,
    );

    return updatedOrder;
  }

  async getOrderByOrderId(orderId: string) {
    const order = await this.ordersService.getOrderByOrderId(orderId);

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    return order;
  }

  async cancelOrder(orderId: string) {
    const existingOrder = await this.ordersService.getOrderByOrderId(orderId);

    if (!existingOrder) {
      throw new BadRequestException('Order not found');
    }

    const updatedOrder = await this.ordersService.updateOrderByOrderId(
      orderId,
      {
        status: OrderStatus.CANCELLED,
      },
    );

    return updatedOrder;
  }

  async getMatchingOrders(matchOrderDto: MatchOrderDto): Promise<string[]> {
    const { tokenA, tokenB } = matchOrderDto;

    const amountA = matchOrderDto.amountA ?? '0';
    const amountB = matchOrderDto.amountB ?? '0';
    const isMarketOrder = amountA === '0';

    if (isMarketOrder) {
      const matchingOrders = await this.prisma.$queryRaw<{ orderId: string }[]>`
        SELECT "orderId"
        FROM "orders"
        WHERE "buyToken" = ${tokenB}
          AND "sellToken" = ${tokenA}
          AND "status" IN ('ACTIVE', 'PARTIALLY_FILLED')
          AND ("buyAmount" - "buyAmountFilled") > 0
          AND ("sellAmount" - "sellAmountFilled") > 0
        ORDER BY 
          CASE 
            WHEN "buyAmount" = 0 THEN 0 
            ELSE ("sellAmount"::numeric / "buyAmount"::numeric) 
          END DESC
      `;

      return matchingOrders.map((order) => order.orderId);
    } else {
      const matchingOrders = await this.prisma.$queryRaw<{ orderId: string }[]>`
        SELECT "orderId"
        FROM "orders"
        WHERE "buyToken" = ${tokenB}
          AND "sellToken" = ${tokenA}
          AND "status" IN ('ACTIVE', 'PARTIALLY_FILLED')
          AND ("buyAmount" - "buyAmountFilled") >= ${amountB}::numeric
          AND ("sellAmount" - "sellAmountFilled") >= ${amountA}::numeric
        ORDER BY 
          CASE 
            WHEN "buyAmount" = 0 THEN 0 
            ELSE ("sellAmount"::numeric / "buyAmount"::numeric) 
          END DESC
      `;

      return matchingOrders.map((order) => order.orderId);
    }
  }
}
