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
CREATE TABLE "event_terms" (
    "id" SERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,

    CONSTRAINT "event_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "terms_path_key" ON "terms"("path");

-- CreateIndex
CREATE UNIQUE INDEX "term_signatories_userId_key" ON "term_signatories"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_terms_eventId_key" ON "event_terms"("eventId");

-- AddForeignKey
ALTER TABLE "term_signatories" ADD CONSTRAINT "term_signatories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_terms" ADD CONSTRAINT "event_terms_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_terms" ADD CONSTRAINT "event_terms_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
