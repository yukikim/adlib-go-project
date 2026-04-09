import { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { adminSeedUsers, participants } from './demo-data.mjs';

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString('hex')}`;
}

function buildMemberEmail(index) {
  return `member${String(index + 1).padStart(2, '0')}@adolib-go.local`;
}

const genderOptions = ['男性', '女性', 'その他'];
const ageRangeOptions = ['20代', '30代', '40代', '50代', '60代', '70代', '80代'];
const prefectureOptions = ['東京都', '神奈川県', '埼玉県', '千葉県', '愛知県', '大阪府', '京都府'];

function buildSubInstrument(instrument) {
  if (instrument === 'vocal') {
    return null;
  }
  if (instrument === 'front') {
    return 'vocal';
  }
  return 'front';
}

async function main() {
  let adminCount = 0;
  let memberCount = 0;
  const adminPasswordHash = await hashPassword('demo-admin-password');
  const memberPasswordHash = await hashPassword('demo-member-password');

  for (const adminUser of adminSeedUsers) {
    await prisma.userAccount.upsert({
      where: { email: adminUser.email },
      update: {
        passwordHash: adminPasswordHash,
        role: 'admin',
        status: 'active',
      },
      create: {
        email: adminUser.email,
        passwordHash: adminPasswordHash,
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
        passwordHash: memberPasswordHash,
        role: 'member',
        status: 'active',
      },
      create: {
        email: buildMemberEmail(index),
        passwordHash: memberPasswordHash,
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
        subInstrument: buildSubInstrument(participant.instrument),
        gender: genderOptions[index % genderOptions.length],
        ageRange: ageRangeOptions[index % ageRangeOptions.length],
        area: prefectureOptions[index % prefectureOptions.length],
        bio: `${participant.name} のデモプロフィールです。`,
      },
      create: {
        userAccountId: user.id,
        displayName: participant.name,
        nickname: participant.name.split(' ')[1] ?? null,
        mainInstrument: participant.instrument,
        subInstrument: buildSubInstrument(participant.instrument),
        gender: genderOptions[index % genderOptions.length],
        ageRange: ageRangeOptions[index % ageRangeOptions.length],
        area: prefectureOptions[index % prefectureOptions.length],
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