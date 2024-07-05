/*
  Warnings:

  - You are about to drop the column `cupomStripeId` on the `EventTicketCupom` table. All the data in the column will be lost.
  - You are about to drop the column `eventTicketId` on the `EventTicketCupom` table. All the data in the column will be lost.
  - Added the required column `cupom_stripe_id` to the `EventTicketCupom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_ticket_id` to the `EventTicketCupom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expire_at` to the `EventTicketCupom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `EventTicketCupom` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EventTicketCupom" DROP CONSTRAINT "EventTicketCupom_eventTicketId_fkey";

-- AlterTable
ALTER TABLE "EventTicketCupom" DROP COLUMN "cupomStripeId",
DROP COLUMN "eventTicketId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "cupom_stripe_id" TEXT NOT NULL,
ADD COLUMN     "event_ticket_id" TEXT NOT NULL,
ADD COLUMN     "expire_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "EventTicketCupom" ADD CONSTRAINT "EventTicketCupom_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
