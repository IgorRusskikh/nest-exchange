/*
  Warnings:

  - You are about to drop the `user_to_tokens` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_to_tokens" DROP CONSTRAINT "user_to_tokens_tokenId_fkey";

-- DropForeignKey
ALTER TABLE "user_to_tokens" DROP CONSTRAINT "user_to_tokens_userId_fkey";

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "user_to_tokens";

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("address") ON DELETE CASCADE ON UPDATE CASCADE;
