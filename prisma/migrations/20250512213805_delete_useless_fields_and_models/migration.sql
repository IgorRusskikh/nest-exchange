/*
  Warnings:

  - You are about to drop the column `txHash` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `order_matches` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "order_matches" DROP CONSTRAINT "order_matches_orderId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "txHash";

-- DropTable
DROP TABLE "order_matches";
