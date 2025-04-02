/*
  Warnings:

  - The `status` column on the `Ledger` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Ledger" DROP COLUMN "status",
ADD COLUMN     "status" "LedgerStatus" NOT NULL DEFAULT 'CREATED';
