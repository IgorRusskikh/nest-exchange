import { OrderStatus, Prisma } from '@prisma/client';

export class ServiceCreateOrderDto {
  buyToken: string;
  sellToken: string;
  buyAmount: Prisma.Decimal;
  sellAmount: Prisma.Decimal;
  isMarketOrder: boolean;
  orderId: string;
}

export class UseCaseCreateOrderDto extends ServiceCreateOrderDto {
  userId: string;
  status?: OrderStatus;
}
