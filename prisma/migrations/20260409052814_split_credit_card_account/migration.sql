/*
  Warnings:

  - You are about to drop the column `availableCredit` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `creditLimit` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `dueDayOfMonth` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "availableCredit",
DROP COLUMN "creditLimit",
DROP COLUMN "dueDayOfMonth";

-- CreateTable
CREATE TABLE "CreditCardAccount" (
    "accountId" TEXT NOT NULL,
    "creditLimit" DECIMAL(14,2) NOT NULL,
    "dueDayOfMonth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCardAccount_pkey" PRIMARY KEY ("accountId")
);

-- AddForeignKey
ALTER TABLE "CreditCardAccount" ADD CONSTRAINT "CreditCardAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
