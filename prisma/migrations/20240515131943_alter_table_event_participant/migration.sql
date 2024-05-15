/*
  Warnings:

  - Added the required column `event_id` to the `event_participants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event_participants" ADD COLUMN     "event_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
