/*
  Warnings:

  - Added the required column `fully_search` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "fully_search" TEXT NOT NULL;
