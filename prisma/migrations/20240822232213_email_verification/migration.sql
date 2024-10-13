-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verifcation_token" TEXT,
ADD COLUMN     "verification_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
