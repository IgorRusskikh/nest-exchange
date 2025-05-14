import { OrderStatus } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { Prisma } from '@prisma/client';
import { UseCaseCreateOrderDto } from './create-order.dto';

export class UpdateOrderDto extends PartialType(UseCaseCreateOrderDto) {
  buyAmountFilled?: Prisma.Decimal;
  sellAmountFilled?: Prisma.Decimal;
  fee?: Prisma.Decimal;
  status?: OrderStatus;
}
