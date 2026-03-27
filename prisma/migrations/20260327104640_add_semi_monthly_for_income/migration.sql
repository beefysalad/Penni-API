-- AlterEnum
ALTER TYPE "RecurrenceFrequency" ADD VALUE 'SEMI_MONTHLY';

-- AlterTable
ALTER TABLE "PlannedItem" ADD COLUMN     "semiMonthlyDays" INTEGER[];
