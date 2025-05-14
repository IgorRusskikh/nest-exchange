import { BlockchainService } from 'src/infrastructure/services/blockchain/blockchain.service';
import { BlockchainTokenService } from 'src/infrastructure/services/blockchain-token/blockchain-token.service';
import { BlockchainUseCase } from 'src/app/use-case/blockchain/blockchain.use-case';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { OrdersService } from 'src/infrastructure/services/orders/orders.service';
import { OrdersUseCase } from 'src/app/use-case/orders/orders.use-case';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.persistence';
import { UsersService } from 'src/infrastructure/services/users/users.service';
import { ethers } from 'ethers';

@Module({
  imports: [],
  providers: [
    {
      provide: 'ETHERS_PROVIDER',
      useFactory: (configService: ConfigService) => {
        const rpcUrl = configService.get('INFURA_RPC_URL');
        return new ethers.JsonRpcProvider(rpcUrl);
      },
      inject: [ConfigService],
    },
    BlockchainService,
    BlockchainTokenService,
    OrdersUseCase,
    OrdersService,
    UsersService,
    PrismaService,
    BlockchainUseCase,
  ],
})
export class BlockchainModule {}
