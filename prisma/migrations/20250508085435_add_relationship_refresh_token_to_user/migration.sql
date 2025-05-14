/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "refreshToken";

-- CreateTable
CREATE TABLE "user_to_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,

    CONSTRAINT "user_to_tokens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_to_tokens" ADD CONSTRAINT "user_to_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_to_tokens" ADD CONSTRAINT "user_to_tokens_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "refresh_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
