import { Injectable, Inject } from '@nestjs/common';
import erc20TokenContract from '../../config/contracts/erc20-token.contract';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainTokenService {
  private readonly decimalsCache = new Map<string, number>();

  constructor(
    @Inject('ETHERS_PROVIDER') private readonly provider: ethers.Provider,
  ) {}

  async getTokenDecimals(tokenAddress: string): Promise<number> {
    const address = tokenAddress.toLowerCase();

    if (this.decimalsCache.has(address)) {
      return this.decimalsCache.get(address)!;
    }

    try {
      const contract = new ethers.Contract(
        address,
        erc20TokenContract.abi,
        this.provider,
      );
      const decimals = await contract.decimals();
      this.decimalsCache.set(address, decimals);

      const formattedDecimals = Number(decimals);

      return formattedDecimals;
    } catch (error) {
      console.error(
        `Ошибка при получении decimals для токена ${address}:`,
        error,
      );
      throw new Error(`Не удалось получить decimals для токена ${address}`);
    }
  }
}
