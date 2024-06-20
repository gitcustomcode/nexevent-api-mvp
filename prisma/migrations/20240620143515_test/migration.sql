/*
  Warnings:

  - You are about to drop the column `event_ticket_id` on the `EventTicketCupom` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventTicketCupom" DROP CONSTRAINT "EventTicketCupom_event_ticket_id_fkey";

-- AlterTable
ALTER TABLE "EventTicketCupom" DROP COLUMN "event_ticket_id";

-- CreateTable
CREATE TABLE "TicketCupom" (
    "id" TEXT NOT NULL,
    "event_ticket_id" TEXT NOT NULL,
    "eventTicketCupomId" TEXT NOT NULL,

    CONSTRAINT "TicketCupom_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TicketCupom" ADD CONSTRAINT "TicketCupom_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketCupom" ADD CONSTRAINT "TicketCupom_eventTicketCupomId_fkey" FOREIGN KEY ("eventTicketCupomId") REFERENCES "EventTicketCupom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
