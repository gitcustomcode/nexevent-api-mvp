-- CreateEnum
CREATE TYPE "EventQuizStatus" AS ENUM ('ENABLE', 'DISABLE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'RATING', 'DESCRIPTIVE');

-- CreateTable
CREATE TABLE "event_quiz" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "status" "EventQuizStatus" NOT NULL DEFAULT 'ENABLE',
    "anonimous_response" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "event_quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_quiz_questions" (
    "id" TEXT NOT NULL,
    "event_quiz_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sequential" INTEGER NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "multiple_choice" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventQuizQuestionOption" (
    "id" TEXT NOT NULL,
    "sequential" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "is_other" BOOLEAN NOT NULL DEFAULT false,
    "other" TEXT,

    CONSTRAINT "EventQuizQuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventQuizParticipant" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_quiz_id" TEXT NOT NULL,
    "event_participant_id" TEXT,
    "is_anonimous" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventQuizParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventQuizParticipantResponse" (
    "id" TEXT NOT NULL,
    "eventQuizQuestionId" TEXT NOT NULL,
    "eventQuizParticipantId" TEXT NOT NULL,
    "eventQuizQuestionOptionId" TEXT,
    "rating" INTEGER,
    "response" TEXT,

    CONSTRAINT "EventQuizParticipantResponse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_quiz" ADD CONSTRAINT "event_quiz_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_quiz" ADD CONSTRAINT "event_quiz_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_quiz_questions" ADD CONSTRAINT "event_quiz_questions_event_quiz_id_fkey" FOREIGN KEY ("event_quiz_id") REFERENCES "event_quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuizParticipant" ADD CONSTRAINT "EventQuizParticipant_event_quiz_id_fkey" FOREIGN KEY ("event_quiz_id") REFERENCES "event_quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuizParticipant" ADD CONSTRAINT "EventQuizParticipant_event_participant_id_fkey" FOREIGN KEY ("event_participant_id") REFERENCES "event_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuizParticipant" ADD CONSTRAINT "EventQuizParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuizParticipantResponse" ADD CONSTRAINT "EventQuizParticipantResponse_eventQuizQuestionOptionId_fkey" FOREIGN KEY ("eventQuizQuestionOptionId") REFERENCES "EventQuizQuestionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuizParticipantResponse" ADD CONSTRAINT "EventQuizParticipantResponse_eventQuizQuestionId_fkey" FOREIGN KEY ("eventQuizQuestionId") REFERENCES "event_quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuizParticipantResponse" ADD CONSTRAINT "EventQuizParticipantResponse_eventQuizParticipantId_fkey" FOREIGN KEY ("eventQuizParticipantId") REFERENCES "EventQuizParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
