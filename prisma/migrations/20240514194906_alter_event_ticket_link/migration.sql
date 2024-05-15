/*
  Warnings:

  - A unique constraint covering the columns `[event_id,slug]` on the table `event_tickets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EventTicketLinkStatus" AS ENUM ('ENABLE', 'FULL', 'PART_FULL');

-- DropIndex
DROP INDEX "event_tickets_slug_key";

-- AlterTable
ALTER TABLE "event_ticket_links" ADD COLUMN     "status" "EventTicketLinkStatus" NOT NULL DEFAULT 'ENABLE';

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_event_id_slug_key" ON "event_tickets"("event_id", "slug");
