/*
  Warnings:

  - A unique constraint covering the columns `[event_id]` on the table `event_configs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventTicketStatus" ADD VALUE 'FULL';
ALTER TYPE "EventTicketStatus" ADD VALUE 'PART_FULL';

-- CreateIndex
CREATE UNIQUE INDEX "event_configs_event_id_key" ON "event_configs"("event_id");
