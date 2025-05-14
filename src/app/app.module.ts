import * as path from 'path';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';

import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { ControllersModule } from 'src/infrastructure/controllers/controllers.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '@nestjs-modules/ioredis';
import { readFileSync } from 'fs';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: async (configService: ConfigService) => {
        const jwtPrivateKeyPath = configService.get<string>(
          'JWT_PRIVATE_KEY_PATH',
        );
        const jwtPublicKeyPath = configService.get<string>(
          'JWT_PUBLIC_KEY_PATH',
        );

        if (!jwtPrivateKeyPath || !jwtPublicKeyPath) {
          throw new Error('JWT key paths are not configured properly');
        }

        try {
          const privateKey = readFileSync(
            path.join(process.cwd(), jwtPrivateKeyPath),
          );
          const publicKey = readFileSync(
            path.join(process.cwd(), jwtPublicKeyPath),
          );

          return {
            privateKey,
            publicKey,
            signOptions: {
              expiresIn: configService.get('JWT_DEFAULT_TOKEN_EXPIRES_IN'),
              algorithm: configService.get('JWT_ALGORITHM'),
            },
          };
        } catch (error) {
          console.error('Error reading JWT keys:', error.message);
          console.error(
            'Private key path:',
            path.join(process.cwd(), jwtPrivateKeyPath),
          );
          console.error(
            'Public key path:',
            path.join(process.cwd(), jwtPublicKeyPath),
          );
          throw new Error(`Failed to read JWT keys: ${error.message}`);
        }
      },
      inject: [ConfigService],
    }),
    ControllersModule,
    AuthModule,
    BlockchainModule,
  ],
  controllers: [],
  providers: [
    Logger,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
