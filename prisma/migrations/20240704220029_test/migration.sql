/*
  Warnings:

  - You are about to drop the column `other` on the `EventQuizQuestionOption` table. All the data in the column will be lost.
  - Added the required column `eventQuizQuestionId` to the `EventQuizQuestionOption` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventQuizQuestionOption" DROP COLUMN "other",
ADD COLUMN     "eventQuizQuestionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "EventQuizQuestionOption" ADD CONSTRAINT "EventQuizQuestionOption_eventQuizQuestionId_fkey" FOREIGN KEY ("eventQuizQuestionId") REFERENCES "event_quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
