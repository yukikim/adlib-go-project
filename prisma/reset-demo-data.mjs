import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.sessionSetMember.deleteMany();
  await prisma.sessionSet.deleteMany();
  await prisma.participantSongRequest.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.song.deleteMany();

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