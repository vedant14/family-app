-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('CREATED', 'IGNORE', 'EXTRACTED');

-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'CREATED';
