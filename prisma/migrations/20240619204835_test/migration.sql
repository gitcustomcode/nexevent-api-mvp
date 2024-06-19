-- AlterEnum
ALTER TYPE "OtpType" ADD VALUE 'VERIFY';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "valid_at" TIMESTAMP(3);
