/*
  Warnings:

  - Changed the type of `hash` on the `Pin` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `salt` on the `Pin` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Pin" DROP COLUMN "hash",
ADD COLUMN     "hash" BYTEA NOT NULL,
DROP COLUMN "salt",
ADD COLUMN     "salt" BYTEA NOT NULL;
