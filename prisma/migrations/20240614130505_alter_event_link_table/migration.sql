-- AlterTable
ALTER TABLE "event_ticket_links" ADD COLUMN     "is_bonus" BOOLEAN DEFAULT false,
ADD COLUMN     "user_id" TEXT;

-- AddForeignKey
ALTER TABLE "event_ticket_links" ADD CONSTRAINT "event_ticket_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
