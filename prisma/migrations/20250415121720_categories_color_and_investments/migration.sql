-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "colorCode" TEXT,
ADD COLUMN     "isDontTrack" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInvestment" BOOLEAN NOT NULL DEFAULT false;
