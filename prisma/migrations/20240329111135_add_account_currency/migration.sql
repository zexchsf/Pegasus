-- CreateEnum
CREATE TYPE "CURRENCY" AS ENUM ('NGN', 'USD');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "currency" "CURRENCY" NOT NULL DEFAULT E'NGN';
