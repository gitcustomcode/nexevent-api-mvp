-- AlterTable
ALTER TABLE "balances_historic" ADD COLUMN     "event_id" TEXT;

-- AddForeignKey
ALTER TABLE "balances_historic" ADD CONSTRAINT "balances_historic_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
