/*
  Warnings:

  - You are about to drop the column `password` on the `event_staffs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EventStaffStatus" AS ENUM ('USER_NOT_ACCEPTED', 'USER_REFUSED', 'USER_ACCEPTED', 'NOT_USER');

-- AlterTable
ALTER TABLE "event_staffs" DROP COLUMN "password",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "status" "EventStaffStatus" NOT NULL DEFAULT 'USER_NOT_ACCEPTED',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" TEXT;

-- AddForeignKey
ALTER TABLE "event_staffs" ADD CONSTRAINT "event_staffs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
