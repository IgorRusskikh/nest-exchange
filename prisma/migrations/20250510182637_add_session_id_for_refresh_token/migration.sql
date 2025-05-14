/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionId` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "refresh_tokens_token_idx";

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "sessionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_sessionId_key" ON "refresh_tokens"("sessionId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_sessionId_idx" ON "refresh_tokens"("token", "sessionId");
