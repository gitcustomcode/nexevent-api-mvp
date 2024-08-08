-- CreateTable
CREATE TABLE "web_socket_connections" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_socket_connections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "web_socket_connections" ADD CONSTRAINT "web_socket_connections_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
