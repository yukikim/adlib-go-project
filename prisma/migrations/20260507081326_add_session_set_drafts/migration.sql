-- CreateTable
CREATE TABLE "SessionSetDraft" (
    "id" TEXT NOT NULL,
    "sessionEventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sessionSetsJson" JSONB NOT NULL,
    "skippedSongsJson" JSONB,
    "forcedSessionSetsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionSetDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionSetDraft_sessionEventId_title_key" ON "SessionSetDraft"("sessionEventId", "title");

-- AddForeignKey
ALTER TABLE "SessionSetDraft" ADD CONSTRAINT "SessionSetDraft_sessionEventId_fkey" FOREIGN KEY ("sessionEventId") REFERENCES "SessionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
