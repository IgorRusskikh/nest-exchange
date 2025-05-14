import { Prisma, User } from '@prisma/client';

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.persistence';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOne(address: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        address,
      },
    });
  }

  async getAll(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  async getOrCreate(address: string): Promise<User> {
    const normalizedAddress = address.toLowerCase();
    const user = await this.getOne(normalizedAddress);

    if (user) {
      return user;
    }

    return this.create({ address: normalizedAddress });
  }

  async create(createUserDto: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data: createUserDto,
    });
  }

  async updateOne(
    address: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User> {
    return await this.prisma.user.update({
      where: {
        address,
      },
      data,
    });
  }

  async deleteOne(address: string): Promise<User> {
    return await this.prisma.user.delete({
      where: { address },
    });
  }
}
