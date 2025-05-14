import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

@Injectable()
export class RateLimiterService {
  private readonly rateLimiter: RateLimiterRedis;

  constructor(private readonly configService: ConfigService) {
    const redisClient = new Redis({
      host: this.configService.get<string>('RL_REDIS_HOST'),
      port: parseInt(this.configService.get<string>('RL_REDIS_PORT')),
    });

    this.rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: this.configService.get<string>('RL_KEY_PREFIX'),
      points: parseInt(this.configService.get<string>('RL_POINTS')),
      duration: parseInt(this.configService.get<string>('RL_DURATION')),
      blockDuration: parseInt(
        this.configService.get<string>('RL_BLOCK_DURATION'),
      ),
    });
  }

  async consume(key: string): Promise<void> {
    try {
      await this.rateLimiter.consume(key);
    } catch (err) {
      throw new Error('Too Many Requests');
    }
  }
}
