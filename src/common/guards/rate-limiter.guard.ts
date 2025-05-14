import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { RateLimiterService } from 'src/infrastructure/services/rate-limiter/rate-limiter.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly rateLimiterService: RateLimiterService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = req.ip;

    try {
      await this.rateLimiterService.consume(key);
      return true;
    } catch {
      throw new BadRequestException('Rate limit exceeded');
    }
  }
}
