/*
  Warnings:

  - Added the required column `qtd` to the `EventTicketBonus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventTicketBonus" ADD COLUMN     "qtd" INTEGER NOT NULL;
