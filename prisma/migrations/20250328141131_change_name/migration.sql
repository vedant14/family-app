/*
  Warnings:

  - You are about to drop the `Extract` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Extract" DROP CONSTRAINT "Extract_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "Extract" DROP CONSTRAINT "Extract_userId_fkey";

-- DropTable
DROP TABLE "Extract";

-- CreateTable
CREATE TABLE "Ledger" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "emailSubject" TEXT,
    "body" TEXT,
    "amountExtract" DOUBLE PRECISION,
    "payeeExtract" TEXT,
    "categoryExtract" "Category",
    "transactionTypeExtract" "TransactionType",
    "emailId" TEXT,
    "sourceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_emailId_key" ON "Ledger"("emailId");

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
