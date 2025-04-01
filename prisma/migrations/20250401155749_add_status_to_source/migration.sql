-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'CREATED', 'INACTIVE');

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'CREATED';
