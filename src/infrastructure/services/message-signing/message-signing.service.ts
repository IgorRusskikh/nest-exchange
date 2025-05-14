import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import Redis from 'ioredis';

@Injectable()
export class MessageSigningService {
  private readonly domain: string;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.domain = this.configService.get<string>('AUTH_DOMAIN');
  }

  async generateNonce(address: string) {
    const normalizedAddress = address.toLowerCase();

    const timestamp = Date.now();
    const randomValue = Math.floor(Math.random() * 1e9);
    const nonce = `${this.domain}:${normalizedAddress}:${timestamp}:${randomValue}`;

    const nonceExpirationSeconds = parseInt(
      this.configService.get<string>('NONCE_EXPIRATION_SECONDS'),
    );

    return {
      address: normalizedAddress,
      expiration: nonceExpirationSeconds,
      nonce,
    };
  }

  async verifySignature(
    address: string,
    signature: string,
    nonce: string,
  ): Promise<boolean> {
    try {
      const recovered = ethers.verifyMessage(nonce, signature);
      const isValid = recovered.toLowerCase() === address.toLowerCase();

      return isValid;
    } catch (error) {
      return false;
    }
  }
}
