-- AlterTable
ALTER TABLE "EventTicketCupom" ADD COLUMN     "event_id" TEXT;

-- AddForeignKey
ALTER TABLE "EventTicketCupom" ADD CONSTRAINT "EventTicketCupom_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
