import { BigNumberish } from 'ethers';

export type IOrderInfo = {
  id: BigNumberish;
  amountA: bigint;
  amountB: bigint;
  amountFilledA: bigint;
  amountFilledB: bigint;
  tokenA: string;
  tokenB: string;
  user: string;
  isMarket: boolean;
};
