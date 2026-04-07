-- CreateEnum
CREATE TYPE "Instrument" AS ENUM ('drum', 'bass', 'piano', 'front', 'vocal');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('front', 'vocal');

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instrument" "Instrument" NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantSongRequest" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "keyName" TEXT,
    "round" INTEGER NOT NULL,

    CONSTRAINT "ParticipantSongRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionSet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "drumId" TEXT,
    "bassId" TEXT,
    "pianoId" TEXT,
    "keyName" TEXT,

    CONSTRAINT "SessionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionSetMember" (
    "id" TEXT NOT NULL,
    "sessionSetId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,

    CONSTRAINT "SessionSetMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Song_title_key" ON "Song"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantSongRequest_participantId_songId_key" ON "ParticipantSongRequest"("participantId", "songId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionSetMember_sessionSetId_participantId_role_key" ON "SessionSetMember"("sessionSetId", "participantId", "role");

-- AddForeignKey
ALTER TABLE "ParticipantSongRequest" ADD CONSTRAINT "ParticipantSongRequest_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantSongRequest" ADD CONSTRAINT "ParticipantSongRequest_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSet" ADD CONSTRAINT "SessionSet_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSet" ADD CONSTRAINT "SessionSet_drumId_fkey" FOREIGN KEY ("drumId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSet" ADD CONSTRAINT "SessionSet_bassId_fkey" FOREIGN KEY ("bassId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSet" ADD CONSTRAINT "SessionSet_pianoId_fkey" FOREIGN KEY ("pianoId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSetMember" ADD CONSTRAINT "SessionSetMember_sessionSetId_fkey" FOREIGN KEY ("sessionSetId") REFERENCES "SessionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSetMember" ADD CONSTRAINT "SessionSetMember_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
