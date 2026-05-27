ALTER TYPE "SessionEventStatus" ADD VALUE IF NOT EXISTS 'announced';
ALTER TYPE "SessionEventStatus" ADD VALUE IF NOT EXISTS 'rating';

CREATE TABLE "SessionEventComment" (
    "id" TEXT NOT NULL,
    "sessionEventId" TEXT NOT NULL,
    "userAccountId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionEventComment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SessionEventComment"
ADD CONSTRAINT "SessionEventComment_sessionEventId_fkey"
FOREIGN KEY ("sessionEventId") REFERENCES "SessionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SessionEventComment"
ADD CONSTRAINT "SessionEventComment_userAccountId_fkey"
FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "SessionEventComment_sessionEventId_createdAt_idx" ON "SessionEventComment"("sessionEventId", "createdAt");