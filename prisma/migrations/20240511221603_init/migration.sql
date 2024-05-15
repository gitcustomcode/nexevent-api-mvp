-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('PARTICIPANT', 'PRODUCER');

-- CreateEnum
CREATE TYPE "BalanceStatus" AS ENUM ('PENDING', 'RECEIVED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FREE', 'PAID_OUT');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('VOID', 'QRCODE', 'FACIAL_IN_SITE', 'FACIAL');

-- CreateEnum
CREATE TYPE "EventTicketStatus" AS ENUM ('ENABLE', 'DISABLE');

-- CreateEnum
CREATE TYPE "EventParticipantHistoricStatus" AS ENUM ('AWAITING_PAYMENT', 'CHECK_IN_EARLY', 'AWAITING_PRINT', 'CHECK_IN', 'CHECK_OUT', 'CANCELED', 'ENABLE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "date_birth" TEXT,
    "document" TEXT,
    "phone_country" TEXT,
    "phone_number" TEXT,
    "street" TEXT,
    "district" TEXT,
    "state" TEXT,
    "city" TEXT,
    "country" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "cep" TEXT,
    "asaas_id" TEXT,
    "type" "UserType" NOT NULL DEFAULT 'PARTICIPANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_facials" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "expiration_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_facials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_socials" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "user_socials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_hobbies" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "user_hobbies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balances_historic" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "invoice_url" TEXT,
    "payment_id" TEXT,
    "status" "BalanceStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balances_historic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" TEXT,
    "slug" TEXT NOT NULL,
    "sequential" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "photo" TEXT,
    "category" TEXT,
    "subtitle" TEXT,
    "description" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'FREE',
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "start_publish_at" TIMESTAMP(3) NOT NULL,
    "end_publish_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_networks" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_costs" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "limit" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_configs" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "print_automatic" BOOLEAN NOT NULL DEFAULT false,
    "credential_type" "CredentialType" NOT NULL DEFAULT 'VOID',
    "limit" INTEGER NOT NULL DEFAULT 20,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_awards" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "description" TEXT,
    "expire_date" TIMESTAMP(3) NOT NULL,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_tickets" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sequential" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "EventTicketStatus" NOT NULL DEFAULT 'ENABLE',
    "color" TEXT,
    "guest" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_ticket_links" (
    "id" TEXT NOT NULL,
    "event_ticket_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "invite" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_ticket_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_ticket_link_id" TEXT NOT NULL,
    "event_ticket_id" TEXT NOT NULL,
    "sequential" INTEGER NOT NULL,
    "is_synchronized" BOOLEAN NOT NULL DEFAULT false,
    "is_printed" BOOLEAN NOT NULL DEFAULT false,
    "signer_id" TEXT NOT NULL,
    "document_signer_id" TEXT NOT NULL,
    "request_signature_key" TEXT NOT NULL,
    "signature" BOOLEAN NOT NULL DEFAULT false,
    "qrcode" TEXT NOT NULL,
    "send_email_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipantHistoric" (
    "id" SERIAL NOT NULL,
    "event_participant_id" TEXT NOT NULL,
    "status" "EventParticipantHistoricStatus" NOT NULL DEFAULT 'ENABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventParticipantHistoric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_networks_event_id_key" ON "event_networks"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_slug_key" ON "event_tickets"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_user_id_event_ticket_id_key" ON "event_participants"("user_id", "event_ticket_id");

-- AddForeignKey
ALTER TABLE "user_facials" ADD CONSTRAINT "user_facials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_socials" ADD CONSTRAINT "user_socials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_hobbies" ADD CONSTRAINT "user_hobbies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balances_historic" ADD CONSTRAINT "balances_historic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_networks" ADD CONSTRAINT "event_networks_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_costs" ADD CONSTRAINT "event_costs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_configs" ADD CONSTRAINT "event_configs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_awards" ADD CONSTRAINT "event_awards_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_ticket_links" ADD CONSTRAINT "event_ticket_links_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_ticket_link_id_fkey" FOREIGN KEY ("event_ticket_link_id") REFERENCES "event_ticket_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipantHistoric" ADD CONSTRAINT "EventParticipantHistoric_event_participant_id_fkey" FOREIGN KEY ("event_participant_id") REFERENCES "event_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
