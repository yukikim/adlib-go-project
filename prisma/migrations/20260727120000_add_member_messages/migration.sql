-- CreateTable
CREATE TABLE "MemberMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "senderDisplayName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberMessage_createdAt_idx" ON "MemberMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "MemberMessage" ADD CONSTRAINT "MemberMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
