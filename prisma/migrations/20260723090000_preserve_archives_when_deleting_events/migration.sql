-- SessionArchive はイベント削除後もスナップショットとして保持する。
ALTER TABLE "SessionArchive"
DROP CONSTRAINT "SessionArchive_sessionEventId_fkey";

ALTER TABLE "SessionArchive"
ALTER COLUMN "sessionEventId" DROP NOT NULL;

ALTER TABLE "SessionArchive"
ADD CONSTRAINT "SessionArchive_sessionEventId_fkey"
FOREIGN KEY ("sessionEventId") REFERENCES "SessionEvent"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- イベントに紐づく sessionSet は履歴画面へ残らないようイベントと同時に削除する。
ALTER TABLE "SessionSet"
DROP CONSTRAINT "SessionSet_sessionEventId_fkey";

ALTER TABLE "SessionSet"
ADD CONSTRAINT "SessionSet_sessionEventId_fkey"
FOREIGN KEY ("sessionEventId") REFERENCES "SessionEvent"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
