-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ACTIVE', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "buyToken" TEXT NOT NULL,
    "sellToken" TEXT NOT NULL,
    "buyAmount" DECIMAL(65,30) NOT NULL,
    "sellAmount" DECIMAL(65,30) NOT NULL,
    "buyAmountFilled" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "sellAmountFilled" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isMarketOrder" BOOLEAN NOT NULL,
    "txHash" TEXT,
    "side" "OrderSide" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderId_key" ON "orders"("orderId");

-- CreateIndex
CREATE INDEX "orders_userId_orderId_buyToken_sellToken_idx" ON "orders"("userId", "orderId", "buyToken", "sellToken");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("address") ON DELETE CASCADE ON UPDATE CASCADE;
