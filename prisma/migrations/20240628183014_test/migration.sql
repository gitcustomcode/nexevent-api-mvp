/*
  Warnings:

  - Added the required column `user_id` to the `user_tickets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_tickets" ADD COLUMN     "user_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
