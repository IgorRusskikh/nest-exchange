import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthUseCase } from 'src/app/use-case/auth/auth.use-case';
import verifyAddressSchema from 'src/common/ajv-schemas/auth/verify-address.schema';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
} from 'src/common/cookies/access-token.cookie';
import {
  SESSION_ID_COOKIE_NAME,
  SESSION_ID_COOKIE_OPTIONS,
} from 'src/common/cookies/session-id.cookie';
import { Public } from 'src/common/decorators/public.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { RateLimitGuard } from 'src/common/guards/rate-limiter.guard';
import { AjvValidationPipe } from 'src/common/pipes/ajv-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  @Post('verify-signature/:address')
  @Public()
  @UseGuards(RateLimitGuard)
  async verifySignature(
    @Res({ passthrough: true }) res: Response,
    @Param('address') address: string,
    @Body(new AjvValidationPipe(verifyAddressSchema)) body: any,
  ) {
    const { accessToken, sessionId, message } =
      await this.authUseCase.verifySignature(address, body.signature);

    res.cookie(
      ACCESS_TOKEN_COOKIE_NAME,
      accessToken,
      ACCESS_TOKEN_COOKIE_OPTIONS,
    );
    res.cookie(SESSION_ID_COOKIE_NAME, sessionId, SESSION_ID_COOKIE_OPTIONS);

    return {
      message,
    };
  }

  @Get('request-nonce/:address')
  @Public()
  @UseGuards(RateLimitGuard)
  async getNonce(@Param('address') address: string) {
    return this.authUseCase.generateNonce(address);
  }

  @Get('refresh-token')
  @Public()
  async refreshToken(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const sessionId = req.cookies[SESSION_ID_COOKIE_NAME];
    const { accessToken, message } =
      await this.authUseCase.refreshAccessToken(sessionId);

    res.cookie(
      ACCESS_TOKEN_COOKIE_NAME,
      accessToken,
      ACCESS_TOKEN_COOKIE_OPTIONS,
    );

    return {
      message,
    };
  }

  @Get('logout')
  async logout(@Res({ passthrough: true }) res: Response, @User() user: any) {
    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME);
    res.clearCookie(SESSION_ID_COOKIE_NAME);

    return await this.authUseCase.logout(user.address);
  }
}
