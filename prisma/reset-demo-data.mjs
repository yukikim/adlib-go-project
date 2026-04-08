import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.mailLog.deleteMany();
    await tx.announcement.deleteMany();
    await tx.adminAuditLog.deleteMany();
    await tx.sessionArchiveRatingSummary.deleteMany();
    await tx.sessionArchiveSet.deleteMany();
    await tx.sessionArchiveParticipant.deleteMany();
    await tx.sessionArchive.deleteMany();
    await tx.sessionSetRating.deleteMany();
    await tx.sessionSetMember.deleteMany();
    await tx.sessionSet.deleteMany();
    await tx.sessionEntryRequest.deleteMany();
    await tx.sessionEntry.deleteMany();
    await tx.memberProfile.deleteMany();
    await tx.userAccount.deleteMany();
    await tx.sessionEvent.deleteMany();
    await tx.participantSongRequest.deleteMany();
    await tx.participant.deleteMany();
    await tx.song.deleteMany();
  });

  console.log(JSON.stringify({ reset: true }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });