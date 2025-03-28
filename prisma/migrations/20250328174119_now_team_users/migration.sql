-- DropForeignKey
ALTER TABLE "Ledger" DROP CONSTRAINT "Ledger_userId_fkey";

-- DropForeignKey
ALTER TABLE "Source" DROP CONSTRAINT "Source_userId_fkey";

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TeamUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TeamUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
