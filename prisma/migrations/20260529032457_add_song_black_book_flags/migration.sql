-- DropIndex
DROP INDEX IF EXISTS "SessionEventComment_sessionEventId_createdAt_idx";

-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "isJazzStandardBible1" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isJazzStandardBible2" BOOLEAN NOT NULL DEFAULT false;
