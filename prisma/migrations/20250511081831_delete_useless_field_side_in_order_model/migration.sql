/*
  Warnings:

  - You are about to drop the column `side` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "side";

-- DropEnum
DROP TYPE "OrderSide";
