-- AlterTable
ALTER TABLE "event_tickets" ADD COLUMN     "is_bonus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "event_ticket_days" (
    "id" SERIAL NOT NULL,
    "event_ticket_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_ticket_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTicketBonus" (
    "id" TEXT NOT NULL,
    "event_ticket_bonus_id" TEXT NOT NULL,
    "event_ticket_bonus_principal_id" TEXT NOT NULL,

    CONSTRAINT "EventTicketBonus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_ticket_days" ADD CONSTRAINT "event_ticket_days_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicketBonus" ADD CONSTRAINT "EventTicketBonus_event_ticket_bonus_principal_id_fkey" FOREIGN KEY ("event_ticket_bonus_principal_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicketBonus" ADD CONSTRAINT "EventTicketBonus_event_ticket_bonus_id_fkey" FOREIGN KEY ("event_ticket_bonus_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
