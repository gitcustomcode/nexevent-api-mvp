/*
  Warnings:

  - The `status` column on the `event_participants` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "event_participants" DROP COLUMN "status",
ADD COLUMN     "status" "EventParticipantStatus" NOT NULL DEFAULT 'AWAITING_FACIAL';
