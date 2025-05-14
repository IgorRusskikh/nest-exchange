export type IBlockchainOrder = {
  id: bigint;
  amountA: bigint;
  amountB: bigint;
  tokenA: string;
  tokenB: string;
  user: string;
  isMarket: boolean;
};
