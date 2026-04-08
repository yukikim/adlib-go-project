import { PrismaClient } from '@prisma/client';
import { adminSeedUsers, participants } from './demo-data.mjs';

const prisma = new PrismaClient();

function buildMemberEmail(index) {
  return `member${String(index + 1).padStart(2, '0')}@adolib-go.local`;
}

async function main() {
  let adminCount = 0;
  let memberCount = 0;

  for (const adminUser of adminSeedUsers) {
    await prisma.userAccount.upsert({
      where: { email: adminUser.email },
      update: {
        passwordHash: adminUser.passwordHash,
        role: 'admin',
        status: 'active',
      },
      create: {
        email: adminUser.email,
        passwordHash: adminUser.passwordHash,
        role: 'admin',
        status: 'active',
      },
    });
    adminCount += 1;
  }

  const dbParticipants = await prisma.participant.findMany({
    orderBy: [{ instrument: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, instrument: true },
  });

  if (dbParticipants.length !== participants.length) {
    throw new Error('Participant seed and auth seed are out of sync. Run npm run seed:participants first.');
  }

  for (const [index, participant] of dbParticipants.entries()) {
    const user = await prisma.userAccount.upsert({
      where: { email: buildMemberEmail(index) },
      update: {
        passwordHash: 'demo-member-password',
        role: 'member',
        status: 'active',
      },
      create: {
        email: buildMemberEmail(index),
        passwordHash: 'demo-member-password',
        role: 'member',
        status: 'active',
      },
      select: { id: true },
    });

    await prisma.memberProfile.upsert({
      where: { userAccountId: user.id },
      update: {
        displayName: participant.name,
        nickname: participant.name.split(' ')[1] ?? null,
        mainInstrument: participant.instrument,
        area: '東京都',
        bio: `${participant.name} のデモプロフィールです。`,
      },
      create: {
        userAccountId: user.id,
        displayName: participant.name,
        nickname: participant.name.split(' ')[1] ?? null,
        mainInstrument: participant.instrument,
        area: '東京都',
        bio: `${participant.name} のデモプロフィールです。`,
      },
    });

    memberCount += 1;
  }

  console.log(JSON.stringify({ adminCount, memberCount }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });