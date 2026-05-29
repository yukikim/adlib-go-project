ALTER TABLE "SessionEvent"
ADD COLUMN "participationFee" INTEGER,
ADD COLUMN "hasAfterParty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "afterPartyFee" INTEGER,
ADD COLUMN "notes" TEXT;