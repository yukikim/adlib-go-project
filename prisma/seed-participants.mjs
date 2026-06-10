import './load-env.mjs';
import { PrismaClient } from '@prisma/client';
import { participants } from './demo-data.mjs';

const prisma = new PrismaClient();
const shouldSeedFromMemberProfiles = process.argv.includes('--from-member-profiles');

function buildParticipantKey(name, instrument) {
  return `${name}::${instrument}`;
}

async function loadSeedParticipants() {
  if (!shouldSeedFromMemberProfiles) {
    return participants;
  }

  const memberProfiles = await prisma.memberProfile.findMany({
    select: {
      displayName: true,
      mainInstrument: true,
    },
    orderBy: [{ displayName: 'asc' }, { mainInstrument: 'asc' }],
  });

  return memberProfiles.map((memberProfile) => ({
    name: memberProfile.displayName,
    instrument: memberProfile.mainInstrument,
  }));
}

async function main() {
  const seedParticipants = await loadSeedParticipants();
  const uniqueSeedParticipants = [];
  const seenParticipantKeys = new Set();
  let duplicateSourceCount = 0;

  for (const participant of seedParticipants) {
    const participantKey = buildParticipantKey(participant.name, participant.instrument);
    if (seenParticipantKeys.has(participantKey)) {
      duplicateSourceCount += 1;
      continue;
    }

    seenParticipantKeys.add(participantKey);
    uniqueSeedParticipants.push(participant);
  }

  let createdCount = 0;
  let existingCount = 0;

  for (const participant of uniqueSeedParticipants) {
    const existing = await prisma.participant.findFirst({
      where: {
        name: participant.name,
        instrument: participant.instrument,
      },
      select: { id: true },
    });

    if (existing) {
      existingCount += 1;
      continue;
    }

    await prisma.participant.create({ data: participant });
    createdCount += 1;
  }

  const summary = await prisma.participant.groupBy({
    by: ['instrument'],
    _count: { _all: true },
    orderBy: { instrument: 'asc' },
  });

  console.log(JSON.stringify({
    source: shouldSeedFromMemberProfiles ? 'memberProfiles' : 'demoData',
    sourceCount: seedParticipants.length,
    uniqueSourceCount: uniqueSeedParticipants.length,
    duplicateSourceCount,
    createdCount,
    existingCount,
    summary,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });