-- CreateEnum
CREATE TYPE "UserTicketStatus" AS ENUM ('AWAITING_PAYMENT', 'COMPLETE');

-- AlterTable
ALTER TABLE "user_tickets" ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "status" "UserTicketStatus" NOT NULL DEFAULT 'COMPLETE';
