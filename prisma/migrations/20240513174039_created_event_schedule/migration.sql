/*
  Warnings:

  - Changed the type of `network` on the `user_socials` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserNetworkType" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'SNAPCHAT', 'TWITTER', 'THREADS', 'TIKTOK', 'GITHUB');

-- AlterTable
ALTER TABLE "user_socials" DROP COLUMN "network",
ADD COLUMN     "network" "UserNetworkType" NOT NULL;

-- CreateTable
CREATE TABLE "EventSchedule" (
    "id" SERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startHour" TEXT NOT NULL,
    "endHour" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "EventSchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventSchedule" ADD CONSTRAINT "EventSchedule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
