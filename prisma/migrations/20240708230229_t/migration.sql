-- DropForeignKey
ALTER TABLE "event_participants" DROP CONSTRAINT "event_participants_event_ticket_price_id_fkey";

-- AlterTable
ALTER TABLE "event_participants" ALTER COLUMN "event_ticket_price_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_ticket_price_id_fkey" FOREIGN KEY ("event_ticket_price_id") REFERENCES "event_ticket_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
