/*
  Warnings:

  - You are about to drop the column `event_ticket_bonus_id` on the `EventTicketBonus` table. All the data in the column will be lost.
  - You are about to drop the column `event_ticket_bonus_principal_id` on the `EventTicketBonus` table. All the data in the column will be lost.
  - Added the required column `event_ticket_bonus_title` to the `EventTicketBonus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_ticket_id` to the `EventTicketBonus` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EventTicketBonus" DROP CONSTRAINT "EventTicketBonus_event_ticket_bonus_id_fkey";

-- DropForeignKey
ALTER TABLE "EventTicketBonus" DROP CONSTRAINT "EventTicketBonus_event_ticket_bonus_principal_id_fkey";

-- AlterTable
ALTER TABLE "EventTicketBonus" DROP COLUMN "event_ticket_bonus_id",
DROP COLUMN "event_ticket_bonus_principal_id",
ADD COLUMN     "event_ticket_bonus_title" TEXT NOT NULL,
ADD COLUMN     "event_ticket_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "EventTicketBonus" ADD CONSTRAINT "EventTicketBonus_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
