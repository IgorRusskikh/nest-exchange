import { Order, Prisma } from '@prisma/client';

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.persistence';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrderByOrderId(orderId: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { orderId },
    });

    return order;
  }

  async getOrdersWithFilters(
    where: Prisma.OrderWhereInput,
    select?: Prisma.OrderSelect,
  ): Promise<Order[]> {
    return this.prisma.order.findMany({
      where,
      select,
    });
  }

  async createOrder(createOrderDto: Prisma.OrderCreateInput): Promise<Order> {
    return this.prisma.order.create({
      data: createOrderDto,
    });
  }

  async updateOrderByOrderId(
    orderId: string,
    updateOrderDto: Prisma.OrderUpdateInput,
  ): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { orderId },
      data: updateOrderDto,
    });

    return order;
  }
}
