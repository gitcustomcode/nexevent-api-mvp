-- AlterTable
ALTER TABLE "balances_historic" ADD COLUMN     "eventTicketId" TEXT;

-- AddForeignKey
ALTER TABLE "balances_historic" ADD CONSTRAINT "balances_historic_eventTicketId_fkey" FOREIGN KEY ("eventTicketId") REFERENCES "event_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
