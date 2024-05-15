/*
  Warnings:

  - The values [AWAITING_PAYMENT,AWAITING_PRINT] on the enum `EventParticipantHistoricStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `status` to the `event_participants` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventParticipantStatus" AS ENUM ('AWAITING_PAYMENT', 'AWAITING_PRINT', 'AWAITING_FACIAL', 'AWAITING_SIGNATURE', 'AWAITING_QUIZ');

-- AlterEnum
BEGIN;
CREATE TYPE "EventParticipantHistoricStatus_new" AS ENUM ('CHECK_IN_EARLY', 'CHECK_IN', 'CHECK_OUT', 'CANCELED', 'ENABLE');
ALTER TABLE "event_participant_historic" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "event_participant_historic" ALTER COLUMN "status" TYPE "EventParticipantHistoricStatus_new" USING ("status"::text::"EventParticipantHistoricStatus_new");
ALTER TYPE "EventParticipantHistoricStatus" RENAME TO "EventParticipantHistoricStatus_old";
ALTER TYPE "EventParticipantHistoricStatus_new" RENAME TO "EventParticipantHistoricStatus";
DROP TYPE "EventParticipantHistoricStatus_old";
ALTER TABLE "event_participant_historic" ALTER COLUMN "status" SET DEFAULT 'ENABLE';
COMMIT;

-- AlterTable
ALTER TABLE "event_configs" ADD COLUMN     "participant_networks" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "event_participants" ADD COLUMN     "status" TEXT NOT NULL,
ALTER COLUMN "signer_id" DROP NOT NULL,
ALTER COLUMN "document_signer_id" DROP NOT NULL,
ALTER COLUMN "request_signature_key" DROP NOT NULL;
