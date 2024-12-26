-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Saving', 'Business');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'CLOSED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_type" "AccountType" NOT NULL DEFAULT E'Saving',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency_code" TEXT NOT NULL DEFAULT E'NGN',
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
