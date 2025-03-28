/*
  Warnings:

  - You are about to drop the column `categoryExtract` on the `Ledger` table. All the data in the column will be lost.
  - You are about to drop the column `defaultCategory` on the `Source` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Ledger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ledger" DROP COLUMN "categoryExtract",
ADD COLUMN     "categoryId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Source" DROP COLUMN "defaultCategory",
ADD COLUMN     "categoryId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "teamId" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "Category";

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "categoryName" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
