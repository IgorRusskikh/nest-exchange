import { AuthController } from './auth/auth.controller';
import { AuthUseCase } from 'src/app/use-case/auth/auth.use-case';
import { MessageSigningService } from '../services/message-signing/message-signing.service';
import { Module } from '@nestjs/common';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from '../services/orders/orders.service';
import { OrdersUseCase } from 'src/app/use-case/orders/orders.use-case';
import { PrismaService } from '../persistence/prisma/prisma.persistence';
import { RateLimiterService } from '../services/rate-limiter/rate-limiter.service';
import { RefreshTokenService } from '../services/refresh-token/refresh-token.service';
import { RefreshTokenUseCase } from 'src/app/use-case/refresh-token/refresh-token.use-case';
import { TokensService } from '../services/tokens/tokens.service';
import { UsersController } from './users/users.controller';
import { UsersService } from '../services/users/users.service';

@Module({
  controllers: [UsersController, AuthController, OrdersController],
  providers: [
    PrismaService,
    UsersService,
    MessageSigningService,
    RateLimiterService,
    TokensService,
    AuthUseCase,
    RefreshTokenService,
    RefreshTokenUseCase,
    OrdersService,
    OrdersUseCase,
  ],
})
export class ControllersModule {}
