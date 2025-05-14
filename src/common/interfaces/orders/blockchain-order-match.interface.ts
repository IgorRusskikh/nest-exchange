export interface IOrderMatchedEvent {
  id: bigint;
  matchedId: bigint;
  amountReceived: bigint;
  amountPaid: bigint;
  amountLeftToFill: bigint;
  fee: bigint;
  feeRate: bigint;
}
