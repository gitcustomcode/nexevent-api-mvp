/*
  Warnings:

  - You are about to drop the column `is_free` on the `event_ticket_prices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "event_ticket_prices" DROP COLUMN "is_free";

-- AlterTable
ALTER TABLE "event_tickets" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_free" BOOLEAN NOT NULL DEFAULT false;
