CREATE TYPE "SessionEventType" AS ENUM ('song_request', 'attendance_only');

ALTER TABLE "SessionEvent"
ADD COLUMN "eventType" "SessionEventType" NOT NULL DEFAULT 'song_request';
