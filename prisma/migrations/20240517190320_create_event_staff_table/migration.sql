/*
  Warnings:

  - You are about to drop the column `group_id` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "group_id";

-- CreateTable
CREATE TABLE "event_staffs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "event_staffs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_staffs" ADD CONSTRAINT "event_staffs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
