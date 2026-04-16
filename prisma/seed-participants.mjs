import './load-env.mjs';
import { PrismaClient } from '@prisma/client';
import { participants } from './demo-data.mjs';

const prisma = new PrismaClient();

async function main() {
  let createdCount = 0;

  for (const participant of participants) {
    const existing = await prisma.participant.findFirst({
      where: {
        name: participant.name,
        instrument: participant.instrument,
      },
      select: { id: true },
    });

    if (existing) {
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

  console.log(JSON.stringify({ createdCount, summary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });