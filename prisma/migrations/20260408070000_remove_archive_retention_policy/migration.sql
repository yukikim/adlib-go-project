-- AlterTable
ALTER TABLE "SessionArchive" DROP COLUMN IF EXISTS "retentionUntil";

-- RedefineEnum
CREATE TYPE "AuditAction_new" AS ENUM ('archive_created', 'archive_deleted', 'session_rating_deleted');

ALTER TABLE "AdminAuditLog"
ALTER COLUMN "action" TYPE "AuditAction_new"
USING ("action"::text::"AuditAction_new");

ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";