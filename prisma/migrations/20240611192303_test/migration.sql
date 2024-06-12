/*
  Warnings:

  - You are about to drop the column `isPrivate` on the `event_tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "event_tickets" DROP COLUMN "isPrivate",
ADD COLUMN     "is_private" BOOLEAN NOT NULL DEFAULT false;
