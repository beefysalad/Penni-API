-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "availableCredit" DECIMAL(14,2),
ADD COLUMN     "creditLimit" DECIMAL(14,2),
ADD COLUMN     "dueDayOfMonth" INTEGER;
