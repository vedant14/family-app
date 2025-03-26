-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MAIL', 'API');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('FOOD_AND_DRINKS', 'SHOPPING', 'GROOMING', 'HEALTH', 'INVESTMENT', 'TRAVEL', 'ENTERTAINMENT', 'OTHERS', 'GROCERIES', 'FUEL', 'BILLS', 'LEARNING', 'LEND_SPLITWISE', 'REFUND', 'SALARY', 'REDEEM', 'SELF_TRANSFER', 'SIDE_INCOME', 'CREDIT_CARD_BILL', 'JUNK');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EXPENSE', 'INCOME');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3) NOT NULL,
    "picture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extract" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Extract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" SERIAL NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'MAIL',
    "query" TEXT,
    "userId" INTEGER NOT NULL,
    "amountRegex" TEXT,
    "amountRegexBackup" TEXT,
    "payeeRegex" TEXT,
    "payeeRegexBackup" TEXT,
    "defaultCategory" "Category",
    "defaultType" "TransactionType",
    "rulePriority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Extract_emailId_key" ON "Extract"("emailId");

-- AddForeignKey
ALTER TABLE "Extract" ADD CONSTRAINT "Extract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Extract" ADD CONSTRAINT "Extract_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

