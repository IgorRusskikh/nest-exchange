import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { MessageSigningService } from 'src/infrastructure/services/message-signing/message-signing.service';
import { TokensService } from 'src/infrastructure/services/tokens/tokens.service';
import { UsersService } from 'src/infrastructure/services/users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenUseCase } from '../refresh-token/refresh-token.use-case';
import { RefreshTokenService } from 'src/infrastructure/services/refresh-token/refresh-token.service';

const NONCE_KEY_PREFIX = 'auth:nonce:';

@Injectable()
export class AuthUseCase {
  constructor(
    private readonly messageSigningService: MessageSigningService,
    @InjectRedis() private readonly redis: Redis,
    private readonly tokensService: TokensService,
    private readonly usersService: UsersService,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async generateNonce(address: string): Promise<string> {
    const {
      address: normalizedAddress,
      expiration,
      nonce,
    } = await this.messageSigningService.generateNonce(address);

    await this.redis.setex(
      `${NONCE_KEY_PREFIX}${normalizedAddress}`,
      expiration,
      nonce,
    );

    return nonce;
  }

  async verifySignature(address: string, signature: string) {
    const normalizedAddress = address.toLowerCase();
    const nonce = await this.redis.get(
      `${NONCE_KEY_PREFIX}${normalizedAddress}`,
    );

    if (!nonce) throw new UnauthorizedException('Invalid nonce');

    const isValid = await this.messageSigningService.verifySignature(
      address,
      signature,
      nonce,
    );

    if (!isValid) throw new UnauthorizedException('Invalid signature');

    await this.redis.del(`${NONCE_KEY_PREFIX}${normalizedAddress}`);
    await this.usersService.getOrCreate(normalizedAddress);

    const sessionId = uuidv4();
    const accessToken = await this.tokensService.generateAccessToken({
      address: normalizedAddress,
    });
    await this.refreshTokenUseCase.createRefreshToken(
      normalizedAddress,
      sessionId,
    );

    return {
      accessToken,
      sessionId,
      message: 'Logged in successfully',
    };
  }

  async refreshAccessToken(sessionId: string) {
    if (!sessionId) {
      throw new UnauthorizedException('Invalid session id');
    }

    const { user } =
      await this.refreshTokenUseCase.verifyRefreshToken(sessionId);

    const accessToken = await this.tokensService.generateAccessToken({
      address: user.address,
    });

    return {
      accessToken,
      message: 'Token refreshed successfully',
    };
  }

  async logout(address: string) {
    const normalizedAddress = address.toLowerCase();
    await this.redis.del(`${NONCE_KEY_PREFIX}${normalizedAddress}`);
    await this.refreshTokenService.deleteManyByUserAddress(normalizedAddress);

    return {
      message: 'Logged out successfully',
    };
  }
}
