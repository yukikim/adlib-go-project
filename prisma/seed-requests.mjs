import { PrismaClient } from '@prisma/client';
import { songTitles, vocalKeys } from './demo-data.mjs';

const prisma = new PrismaClient();

function pickUniqueSongs(startIndex, count, excludedTitles = []) {
  const selections = [];
  let offset = 0;

  while (selections.length < count) {
    const title = songTitles[(startIndex + offset) % songTitles.length];
    if (!selections.includes(title) && !excludedTitles.includes(title)) {
      selections.push(title);
    }
    offset += 1;

    if (offset > songTitles.length * 2) {
      throw new Error('Unable to choose enough unique songs for the seed plan.');
    }
  }

  return selections;
}

function buildPlan(participant, index) {
  const round1 = pickUniqueSongs(index * 2, 2);
  const round2Pool = pickUniqueSongs(index * 2 + 5, participant.instrument === 'vocal' ? 1 : 2, round1);

  if (participant.instrument === 'vocal') {
    return [
      { songTitle: round1[0], round: 1, keyName: vocalKeys[index % vocalKeys.length] },
      { songTitle: round1[1], round: 1, keyName: vocalKeys[(index + 2) % vocalKeys.length] },
      { songTitle: round2Pool[0], round: 2, keyName: vocalKeys[(index + 4) % vocalKeys.length] },
    ];
  }

  return [
    { songTitle: round1[0], round: 1 },
    { songTitle: round1[1], round: 1 },
    { songTitle: round2Pool[0], round: 2 },
    { songTitle: round2Pool[1], round: 2 },
  ];
}

async function main() {
  for (const title of songTitles) {
    await prisma.song.upsert({
      where: { title },
      update: {},
      create: { title },
    });
  }

  const participants = await prisma.participant.findMany({
    orderBy: [{ instrument: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, instrument: true },
  });

  if (participants.length === 0) {
    throw new Error('No participants found. Run npm run seed:participants first.');
  }

  let createdCount = 0;

  for (const [index, participant] of participants.entries()) {
    const plan = buildPlan(participant, index);

    for (const request of plan) {
      const song = await prisma.song.findUnique({
        where: { title: request.songTitle },
        select: { id: true },
      });

      const existing = await prisma.participantSongRequest.findFirst({
        where: {
          participantId: participant.id,
          song: { title: request.songTitle },
        },
        select: { id: true },
      });

      if (existing || !song) {
        continue;
      }

      await prisma.participantSongRequest.create({
        data: {
          participantId: participant.id,
          songId: song.id,
          round: request.round,
          keyName: request.keyName ?? null,
        },
      });

      createdCount += 1;
    }
  }

  const requestSummary = await prisma.participantSongRequest.groupBy({
    by: ['round'],
    _count: { _all: true },
    orderBy: { round: 'asc' },
  });

  const songCount = await prisma.song.count();

  console.log(JSON.stringify({ createdCount, songCount, requestSummary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });