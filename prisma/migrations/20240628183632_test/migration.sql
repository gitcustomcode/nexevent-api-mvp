-- AlterTable
ALTER TABLE "event_ticket_links" ADD COLUMN     "user_ticket_id" TEXT;

-- AddForeignKey
ALTER TABLE "event_ticket_links" ADD CONSTRAINT "event_ticket_links_user_ticket_id_fkey" FOREIGN KEY ("user_ticket_id") REFERENCES "user_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
