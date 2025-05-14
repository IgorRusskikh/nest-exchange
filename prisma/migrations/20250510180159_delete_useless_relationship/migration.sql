/*
  Warnings:

  - You are about to drop the column `userId` on the `refresh_tokens` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "userId";
