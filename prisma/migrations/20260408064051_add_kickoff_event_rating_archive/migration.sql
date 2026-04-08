-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended', 'invited');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('attending', 'absent', 'undecided');

-- CreateEnum
CREATE TYPE "SessionEventStatus" AS ENUM ('draft', 'recruiting_round1', 'recruiting_round2', 'generating', 'published', 'closed');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('archive_created', 'archive_deleted', 'archive_retention_expired', 'session_rating_deleted');

-- AlterTable
ALTER TABLE "SessionSet" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionEventId" TEXT,
ADD COLUMN     "setOrder" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "lastSignedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberProfile" (
    "id" TEXT NOT NULL,
    "userAccountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "nickname" TEXT,
    "mainInstrument" "Instrument" NOT NULL,
    "subInstrument" TEXT,
    "gender" TEXT,
    "ageRange" TEXT,
    "area" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "venue" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "round1StartAt" TIMESTAMP(3),
    "round1EndAt" TIMESTAMP(3),
    "round2StartAt" TIMESTAMP(3),
    "round2EndAt" TIMESTAMP(3),
    "status" "SessionEventStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionEntry" (
    "id" TEXT NOT NULL,
    "sessionEventId" TEXT NOT NULL,
    "memberProfileId" TEXT NOT NULL,
    "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'attending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionEntryRequest" (
    "id" TEXT NOT NULL,
    "sessionEntryId" TEXT NOT NULL,
    "songId" TEXT,
    "songTitleSnapshot" TEXT NOT NULL,
    "keyName" TEXT,
    "round" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionEntryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionSetRating" (
    "id" TEXT NOT NULL,
    "sessionEventId" TEXT NOT NULL,
    "sessionSetId" TEXT NOT NULL,
    "userAccountId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "ratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionSetRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionArchive" (
    "id" TEXT NOT NULL,
    "sessionEventId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "participantCount" INTEGER NOT NULL,
    "note" TEXT,
    "retentionUntil" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionArchive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionArchiveParticipant" (
    "id" TEXT NOT NULL,
    "sessionArchiveId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "mainInstrument" "Instrument",

    CONSTRAINT "SessionArchiveParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionArchiveSet" (
    "id" TEXT NOT NULL,
    "sessionArchiveId" TEXT NOT NULL,
    "songTitle" TEXT NOT NULL,
    "setOrder" INTEGER,
    "drumName" TEXT,
    "bassName" TEXT,
    "pianoName" TEXT,
    "frontSnapshot" JSONB,
    "vocalSnapshot" JSONB,
    "keyName" TEXT,

    CONSTRAINT "SessionArchiveSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionArchiveRatingSummary" (
    "id" TEXT NOT NULL,
    "sessionArchiveSetId" TEXT NOT NULL,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "minRating" INTEGER,
    "maxRating" INTEGER,
    "distributionJson" JSONB,

    CONSTRAINT "SessionArchiveRatingSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "summary" TEXT,
    "payload" JSONB,
    "performedById" TEXT NOT NULL,
    "sessionArchiveId" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_userAccountId_key" ON "MemberProfile"("userAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionEntry_sessionEventId_memberProfileId_key" ON "SessionEntry"("sessionEventId", "memberProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionSetRating_sessionSetId_userAccountId_key" ON "SessionSetRating"("sessionSetId", "userAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionArchive_sessionEventId_version_key" ON "SessionArchive"("sessionEventId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SessionArchiveRatingSummary_sessionArchiveSetId_key" ON "SessionArchiveRatingSummary"("sessionArchiveSetId");

-- AddForeignKey
ALTER TABLE "SessionSet" ADD CONSTRAINT "SessionSet_sessionEventId_fkey" FOREIGN KEY ("sessionEventId") REFERENCES "SessionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEntry" ADD CONSTRAINT "SessionEntry_sessionEventId_fkey" FOREIGN KEY ("sessionEventId") REFERENCES "SessionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEntry" ADD CONSTRAINT "SessionEntry_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEntryRequest" ADD CONSTRAINT "SessionEntryRequest_sessionEntryId_fkey" FOREIGN KEY ("sessionEntryId") REFERENCES "SessionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEntryRequest" ADD CONSTRAINT "SessionEntryRequest_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSetRating" ADD CONSTRAINT "SessionSetRating_sessionEventId_fkey" FOREIGN KEY ("sessionEventId") REFERENCES "SessionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSetRating" ADD CONSTRAINT "SessionSetRating_sessionSetId_fkey" FOREIGN KEY ("sessionSetId") REFERENCES "SessionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSetRating" ADD CONSTRAINT "SessionSetRating_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionArchive" ADD CONSTRAINT "SessionArchive_sessionEventId_fkey" FOREIGN KEY ("sessionEventId") REFERENCES "SessionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionArchive" ADD CONSTRAINT "SessionArchive_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionArchiveParticipant" ADD CONSTRAINT "SessionArchiveParticipant_sessionArchiveId_fkey" FOREIGN KEY ("sessionArchiveId") REFERENCES "SessionArchive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionArchiveSet" ADD CONSTRAINT "SessionArchiveSet_sessionArchiveId_fkey" FOREIGN KEY ("sessionArchiveId") REFERENCES "SessionArchive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionArchiveRatingSummary" ADD CONSTRAINT "SessionArchiveRatingSummary_sessionArchiveSetId_fkey" FOREIGN KEY ("sessionArchiveSetId") REFERENCES "SessionArchiveSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_sessionArchiveId_fkey" FOREIGN KEY ("sessionArchiveId") REFERENCES "SessionArchive"("id") ON DELETE SET NULL ON UPDATE CASCADE;
