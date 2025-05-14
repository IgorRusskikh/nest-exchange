-- CreateTable
CREATE TABLE "order_matches" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "amountPaid" DECIMAL(38,18) NOT NULL,
    "amountReceived" DECIMAL(38,18) NOT NULL,
    "fee" DECIMAL(38,18) NOT NULL,
    "amountLeftToFill" DECIMAL(38,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_matches_orderId_matchId_idx" ON "order_matches"("orderId", "matchId");

-- AddForeignKey
ALTER TABLE "order_matches" ADD CONSTRAINT "order_matches_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
