-- CreateTable
CREATE TABLE "EventTicketCupom" (
    "id" TEXT NOT NULL,
    "eventTicketId" TEXT NOT NULL,
    "cupomStripeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "EventTicketCupom_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventTicketCupom" ADD CONSTRAINT "EventTicketCupom_eventTicketId_fkey" FOREIGN KEY ("eventTicketId") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
