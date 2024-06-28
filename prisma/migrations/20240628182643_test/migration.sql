-- CreateTable
CREATE TABLE "user_tickets" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_ticket_id" TEXT NOT NULL,
    "event_ticket_price_id" TEXT NOT NULL,
    "qtd" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tickets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_event_ticket_price_id_fkey" FOREIGN KEY ("event_ticket_price_id") REFERENCES "event_ticket_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
