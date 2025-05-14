import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { RefreshTokenService } from 'src/infrastructure/services/refresh-token/refresh-token.service';
import { TokensService } from 'src/infrastructure/services/tokens/tokens.service';
import { UsersService } from 'src/infrastructure/services/users/users.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly tokensService: TokensService,
    private readonly usersService: UsersService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async createRefreshToken(address: string, sessionId: string) {
    const user = await this.usersService.getOne(address);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const generatedRefreshToken = await this.tokensService.generateRefreshToken(
      {
        tokenId: uuidv4(),
        address,
      },
    );
    const refreshToken = await this.refreshTokenService.create({
      token: generatedRefreshToken,
      sessionId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      user: {
        connect: {
          address,
        },
      },
    });

    return refreshToken;
  }

  async verifyRefreshToken(sessionId: string) {
    const refreshTokenData = await this.refreshTokenService.getOneBySessionId(
      sessionId,
      {
        user: {
          select: {
            address: true,
          },
        },
      },
    );

    if (!refreshTokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      const isValid = await this.tokensService.verifyToken(
        refreshTokenData.token,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (refreshTokenData.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      return {
        refreshToken: refreshTokenData,
        user: refreshTokenData.user,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
