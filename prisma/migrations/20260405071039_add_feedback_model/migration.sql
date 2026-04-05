-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('BUG_REPORT', 'GENERAL_FEEDBACK', 'FEATURE_REQUEST', 'SHOW_SOME_LOVE');

-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('FRUSTRATED', 'UNHAPPY', 'NEUTRAL', 'HAPPY', 'LOVING_IT');

-- CreateTable
CREATE TABLE "FeedBack" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL,
    "message" TEXT NOT NULL,
    "mood" "Mood" NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedBack_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeedBack" ADD CONSTRAINT "FeedBack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
