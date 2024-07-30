-- CreateTable
CREATE TABLE "SponsorUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,

    CONSTRAINT "SponsorUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SponsorUser" ADD CONSTRAINT "SponsorUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
