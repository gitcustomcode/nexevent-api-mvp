-- CreateTable
CREATE TABLE "user_event_network_historic" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_participant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_event_network_historic_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_event_network_historic" ADD CONSTRAINT "user_event_network_historic_event_participant_id_fkey" FOREIGN KEY ("event_participant_id") REFERENCES "event_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_network_historic" ADD CONSTRAINT "user_event_network_historic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
