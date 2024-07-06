-- DropForeignKey
ALTER TABLE "event_ticket_links" DROP CONSTRAINT "event_ticket_links_event_ticket_price_id_fkey";

-- AlterTable
ALTER TABLE "event_ticket_links" ALTER COLUMN "event_ticket_price_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "event_ticket_links" ADD CONSTRAINT "event_ticket_links_event_ticket_price_id_fkey" FOREIGN KEY ("event_ticket_price_id") REFERENCES "event_ticket_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
