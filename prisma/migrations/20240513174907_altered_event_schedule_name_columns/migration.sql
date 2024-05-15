/*
  Warnings:

  - You are about to drop the `EventSchedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventSchedule" DROP CONSTRAINT "EventSchedule_eventId_fkey";

-- DropTable
DROP TABLE "EventSchedule";

-- CreateTable
CREATE TABLE "event_schedule" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "start_hour" TEXT NOT NULL,
    "end_hour" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "event_schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_schedule" ADD CONSTRAINT "event_schedule_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
