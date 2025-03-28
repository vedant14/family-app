-- DropForeignKey
ALTER TABLE "Ledger" DROP CONSTRAINT "Ledger_categoryId_fkey";

-- AlterTable
ALTER TABLE "Ledger" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
