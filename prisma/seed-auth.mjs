import './load-env.mjs';
import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { adminSeedUsers, participants } from './demo-data.mjs';

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);
const MEMBER_EMAIL_DOMAIN = 'adlib-go.local';
const LEGACY_MEMBER_EMAIL_DOMAINS = ['adolib-go.local'];
const FRONT_SUB_INSTRUMENT_OPTIONS = ['アルトサックス', 'テナーサックス', 'トランペット', 'ギター', 'トロンボーン', 'フルート'];

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString('hex')}`;
}

function buildMemberEmail(index, domain = MEMBER_EMAIL_DOMAIN) {
  return `member${String(index + 1).padStart(2, '0')}@${domain}`;
}

function buildLegacyMemberEmails(index) {
  return LEGACY_MEMBER_EMAIL_DOMAINS.map((domain) => buildMemberEmail(index, domain));
}

const genderOptions = ['男性', '女性', 'その他'];
const ageRangeOptions = ['20代', '30代', '40代', '50代', '60代', '70代', '80代'];
const prefectureOptions = ['東京都', '神奈川県', '埼玉県', '千葉県', '愛知県', '大阪府', '京都府'];

function buildFrontSubInstrument(participantKey) {
  const digest = createHash('sha256').update(participantKey).digest();
  return FRONT_SUB_INSTRUMENT_OPTIONS[digest[0] % FRONT_SUB_INSTRUMENT_OPTIONS.length];
}

function buildSubInstrument(participant, index) {
  if (participant.instrument === 'vocal') {
    return null;
  }
  if (participant.instrument === 'front') {
    return buildFrontSubInstrument(`${participant.id}:${participant.name}:${index}`);
  }
  return 'front';
}

async function resolveSeedMemberUser(participant, index, memberPasswordHash) {
  const canonicalEmail = buildMemberEmail(index);
  const existingUsers = await prisma.userAccount.findMany({
    where: {
      OR: [
        { email: canonicalEmail },
        ...buildLegacyMemberEmails(index).map((email) => ({ email })),
        {
          memberProfile: {
            is: {
              displayName: participant.name,
              mainInstrument: participant.instrument,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (existingUsers.length > 1) {
    throw new Error([
      `Ambiguous demo member seed target for ${participant.name} (${participant.instrument}).`,
      'Run `npm run audit:member-duplicates` to inspect duplicates,',
      'then `npm run fix:member-duplicates -- --apply` before rerunning seed:auth.',
    ].join(' '));
  }

  if (existingUsers.length === 1) {
    return prisma.userAccount.update({
      where: { id: existingUsers[0].id },
      data: {
        email: canonicalEmail,
        passwordHash: memberPasswordHash,
        role: 'member',
        status: 'active',
      },
      select: { id: true },
    });
  }

  return prisma.userAccount.create({
    data: {
      email: canonicalEmail,
      passwordHash: memberPasswordHash,
      role: 'member',
      status: 'active',
    },
    select: { id: true },
  });
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
    const user = await resolveSeedMemberUser(participant, index, memberPasswordHash);

    await prisma.memberProfile.upsert({
      where: { userAccountId: user.id },
      update: {
        displayName: participant.name,
        nickname: participant.name.split(' ')[1] ?? null,
        mainInstrument: participant.instrument,
        subInstrument: buildSubInstrument(participant, index),
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
        subInstrument: buildSubInstrument(participant, index),
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