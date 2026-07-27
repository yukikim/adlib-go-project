-- Retention cleanup filters both log tables by their creation timestamps.
CREATE INDEX "AdminAuditLog_performedAt_idx" ON "AdminAuditLog"("performedAt");
CREATE INDEX "MailLog_createdAt_idx" ON "MailLog"("createdAt");
