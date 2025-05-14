/*
  Warnings:

  - You are about to alter the column `buyAmount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(38,18)`.
  - You are about to alter the column `sellAmount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(38,18)`.
  - You are about to alter the column `buyAmountFilled` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(38,18)`.
  - You are about to alter the column `sellAmountFilled` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(38,18)`.

*/
-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "buyAmount" SET DATA TYPE DECIMAL(38,18),
ALTER COLUMN "sellAmount" SET DATA TYPE DECIMAL(38,18),
ALTER COLUMN "buyAmountFilled" SET DATA TYPE DECIMAL(38,18),
ALTER COLUMN "sellAmountFilled" SET DATA TYPE DECIMAL(38,18);
