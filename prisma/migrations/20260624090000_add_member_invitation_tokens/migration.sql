CREATE TABLE "MemberInvitationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "MemberInvitationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberInvitationToken_tokenHash_key" ON "MemberInvitationToken"("tokenHash");
CREATE INDEX "MemberInvitationToken_email_idx" ON "MemberInvitationToken"("email");
CREATE INDEX "MemberInvitationToken_expiresAt_idx" ON "MemberInvitationToken"("expiresAt");
ALTER TABLE "MemberInvitationToken" ADD CONSTRAINT "MemberInvitationToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
