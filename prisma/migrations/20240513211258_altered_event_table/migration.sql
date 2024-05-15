-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('ENABLE', 'DISABLE');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'ENABLE';
