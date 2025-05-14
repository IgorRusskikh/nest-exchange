import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.persistence';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async getOneById(id: string) {
    return await this.prisma.refreshToken.findUnique({
      where: { id },
    });
  }

  async getOneBySessionId(
    sessionId: string,
    include?: Prisma.RefreshTokenInclude,
  ) {
    return await this.prisma.refreshToken.findUnique({
      where: { sessionId },
      include,
    });
  }

  async getOneByToken(token: string) {
    return await this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async getAll() {
    return await this.prisma.refreshToken.findMany();
  }

  async create(data: Prisma.RefreshTokenCreateInput) {
    return await this.prisma.refreshToken.create({
      data,
    });
  }

  async update(id: string, data: Prisma.RefreshTokenUpdateInput) {
    return await this.prisma.refreshToken.update({
      where: { id },
      data,
    });
  }

  async deleteManyByUserAddress(address: string) {
    return await this.prisma.refreshToken.deleteMany({
      where: {
        userId: {
          equals: address,
        },
      },
    });
  }
}
