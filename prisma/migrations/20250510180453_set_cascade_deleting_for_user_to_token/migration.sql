-- DropForeignKey
ALTER TABLE "user_to_tokens" DROP CONSTRAINT "user_to_tokens_tokenId_fkey";

-- DropForeignKey
ALTER TABLE "user_to_tokens" DROP CONSTRAINT "user_to_tokens_userId_fkey";

-- AddForeignKey
ALTER TABLE "user_to_tokens" ADD CONSTRAINT "user_to_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_to_tokens" ADD CONSTRAINT "user_to_tokens_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "refresh_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
