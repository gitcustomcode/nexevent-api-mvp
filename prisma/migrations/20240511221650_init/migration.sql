/*
  Warnings:

  - You are about to drop the `EventParticipantHistoric` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventParticipantHistoric" DROP CONSTRAINT "EventParticipantHistoric_event_participant_id_fkey";

-- DropTable
DROP TABLE "EventParticipantHistoric";

-- CreateTable
CREATE TABLE "event_participant_historic" (
    "id" SERIAL NOT NULL,
    "event_participant_id" TEXT NOT NULL,
    "status" "EventParticipantHistoricStatus" NOT NULL DEFAULT 'ENABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participant_historic_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_participant_historic" ADD CONSTRAINT "event_participant_historic_event_participant_id_fkey" FOREIGN KEY ("event_participant_id") REFERENCES "event_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
