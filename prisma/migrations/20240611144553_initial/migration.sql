-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('PARTICIPANT', 'PRODUCER');

-- CreateEnum
CREATE TYPE "UserNetworkType" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'SNAPCHAT', 'TWITTER', 'THREADS', 'TIKTOK', 'GITHUB');

-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('RECOVERY', 'TWO_AUTH');

-- CreateEnum
CREATE TYPE "BalanceStatus" AS ENUM ('PENDING', 'RECEIVED');

-- CreateEnum
CREATE TYPE "EventLocation" AS ENUM ('ONLINE', 'UNDEFINED', 'DEFINED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FREE', 'PAID_OUT', 'PASSED_CLIENT');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('ENABLE', 'DISABLE');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('VOID', 'QRCODE', 'FACIAL_IN_SITE', 'FACIAL');

-- CreateEnum
CREATE TYPE "EventTicketStatus" AS ENUM ('ENABLE', 'DISABLE');

-- CreateEnum
CREATE TYPE "EventTicketPriceStatus" AS ENUM ('ENABLE', 'DISABLE', 'FULL', 'PART_FULL');

-- CreateEnum
CREATE TYPE "EventTicketLinkStatus" AS ENUM ('ENABLE', 'FULL', 'PART_FULL');

-- CreateEnum
CREATE TYPE "EventParticipantStatus" AS ENUM ('AWAITING_PAYMENT', 'AWAITING_PRINT', 'AWAITING_FACIAL', 'AWAITING_SIGNATURE', 'AWAITING_QUIZ', 'COMPLETE');

-- CreateEnum
CREATE TYPE "EventParticipantHistoricStatus" AS ENUM ('CHECK_IN_EARLY', 'CHECK_IN', 'CHECK_OUT', 'CANCELED', 'ENABLE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "date_birth" TEXT,
    "document" TEXT,
    "phone_country" TEXT,
    "phone_number" TEXT,
    "profile_photo" TEXT,
    "street" TEXT,
    "district" TEXT,
    "state" TEXT,
    "city" TEXT,
    "country" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "cep" TEXT,
    "stripe_customer_id" TEXT,
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
    "network" "UserNetworkType" NOT NULL,
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
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "OtpType" NOT NULL,
    "number" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "date_expiration" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balances_historic" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_participant_id" TEXT,
    "value" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "payment_id" TEXT,
    "status" "BalanceStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balances_historic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "autoClose" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "sequenceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "remindInterval" TEXT,
    "blockAfterRefusal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "term_signatories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auths" TEXT NOT NULL DEFAULT 'api',
    "communicateBy" TEXT NOT NULL DEFAULT 'whatsapp',
    "delivery" TEXT NOT NULL DEFAULT 'none',
    "handwrittenEnabled" BOOLEAN NOT NULL DEFAULT false,
    "hasDocumentation" BOOLEAN NOT NULL DEFAULT false,
    "livenessEnabled" BOOLEAN NOT NULL DEFAULT false,
    "locationRequiredEnabled" BOOLEAN NOT NULL DEFAULT false,
    "officialDocumentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "selfieEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "term_signatories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sequential" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "photo" TEXT,
    "category" TEXT,
    "description" TEXT,
    "location" "EventLocation" NOT NULL DEFAULT 'UNDEFINED',
    "latitude" TEXT,
    "longitude" TEXT,
    "checkout_url" TEXT,
    "payment_status" TEXT,
    "sell_on_the_platform" BOOLEAN NOT NULL DEFAULT false,
    "type" "EventType" NOT NULL DEFAULT 'FREE',
    "public" BOOLEAN NOT NULL DEFAULT true,
    "status" "EventStatus" NOT NULL DEFAULT 'ENABLE',
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "start_publish_at" TIMESTAMP(3) NOT NULL,
    "end_publish_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPhoto" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "EventPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_staffs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "send_email_at" TIMESTAMP(3),

    CONSTRAINT "event_staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_schedule" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "start_hour" TEXT NOT NULL,
    "end_hour" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "event_schedule_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "event_configs" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "print_automatic" BOOLEAN NOT NULL DEFAULT false,
    "credential_type" "CredentialType" NOT NULL DEFAULT 'VOID',
    "participant_networks" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_terms" (
    "id" SERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "signature" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_terms_pkey" PRIMARY KEY ("id")
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
    "status" "EventTicketStatus" NOT NULL DEFAULT 'ENABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_ticket_prices" (
    "id" TEXT NOT NULL,
    "event_ticket_id" TEXT NOT NULL,
    "stripe_price_id" TEXT,
    "status" "EventTicketPriceStatus" NOT NULL DEFAULT 'ENABLE',
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "is_promotion" BOOLEAN NOT NULL DEFAULT false,
    "batch" INTEGER NOT NULL,
    "guests" INTEGER NOT NULL,
    "guest_bonus" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2) NOT NULL,
    "pass_on_fee" BOOLEAN NOT NULL DEFAULT false,
    "start_publish_at" TIMESTAMP(3) NOT NULL,
    "end_publish_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_ticket_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_ticket_links" (
    "id" TEXT NOT NULL,
    "event_ticket_id" TEXT NOT NULL,
    "event_ticket_price_id" TEXT NOT NULL,
    "invite" INTEGER NOT NULL,
    "status" "EventTicketLinkStatus" NOT NULL DEFAULT 'ENABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_ticket_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_ticket_link_id" TEXT NOT NULL,
    "event_ticket_price_id" TEXT NOT NULL,
    "event_ticket_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "sequential" INTEGER NOT NULL,
    "is_synchronized" BOOLEAN NOT NULL DEFAULT false,
    "is_printed" BOOLEAN NOT NULL DEFAULT false,
    "signer_id" TEXT,
    "document_signer_id" TEXT,
    "request_signature_key" TEXT,
    "signature" BOOLEAN NOT NULL DEFAULT false,
    "qrcode" TEXT NOT NULL,
    "status" "EventParticipantStatus" NOT NULL DEFAULT 'AWAITING_FACIAL',
    "send_email_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participant_historic" (
    "id" SERIAL NOT NULL,
    "event_participant_id" TEXT NOT NULL,
    "status" "EventParticipantHistoricStatus" NOT NULL DEFAULT 'ENABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participant_historic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "terms_path_key" ON "terms"("path");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_configs_event_id_key" ON "event_configs"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_terms_eventId_key" ON "event_terms"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_event_id_slug_key" ON "event_tickets"("event_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_user_id_event_ticket_id_key" ON "event_participants"("user_id", "event_ticket_id");

-- AddForeignKey
ALTER TABLE "user_facials" ADD CONSTRAINT "user_facials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_socials" ADD CONSTRAINT "user_socials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_hobbies" ADD CONSTRAINT "user_hobbies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balances_historic" ADD CONSTRAINT "balances_historic_event_participant_id_fkey" FOREIGN KEY ("event_participant_id") REFERENCES "event_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balances_historic" ADD CONSTRAINT "balances_historic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "term_signatories" ADD CONSTRAINT "term_signatories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPhoto" ADD CONSTRAINT "EventPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_staffs" ADD CONSTRAINT "event_staffs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_schedule" ADD CONSTRAINT "event_schedule_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_networks" ADD CONSTRAINT "event_networks_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_configs" ADD CONSTRAINT "event_configs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_terms" ADD CONSTRAINT "event_terms_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_terms" ADD CONSTRAINT "event_terms_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_awards" ADD CONSTRAINT "event_awards_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_ticket_prices" ADD CONSTRAINT "event_ticket_prices_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_ticket_links" ADD CONSTRAINT "event_ticket_links_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_ticket_links" ADD CONSTRAINT "event_ticket_links_event_ticket_price_id_fkey" FOREIGN KEY ("event_ticket_price_id") REFERENCES "event_ticket_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "event_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_ticket_link_id_fkey" FOREIGN KEY ("event_ticket_link_id") REFERENCES "event_ticket_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_ticket_price_id_fkey" FOREIGN KEY ("event_ticket_price_id") REFERENCES "event_ticket_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participant_historic" ADD CONSTRAINT "event_participant_historic_event_participant_id_fkey" FOREIGN KEY ("event_participant_id") REFERENCES "event_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
