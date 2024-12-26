-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "available_balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT E'ACTIVE';

-- CreateTable
CREATE TABLE "Pin" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_failed_attempt" TIMESTAMP(3),
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pin_account_id_key" ON "Pin"("account_id");

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
