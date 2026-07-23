import './load-env.mjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const VALID_INSTRUMENTS = new Set(['drum', 'bass', 'piano', 'front', 'vocal']);

function readOption(name) {
  const prefix = `--${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length).trim();
  return value || null;
}

function requireOption(name) {
  const value = readOption(name);
  if (!value) {
    throw new Error(`--${name}=... is required`);
  }
  return value;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const email = requireOption('email').toLowerCase();
  const displayName = requireOption('display-name');
  const mainInstrument = requireOption('main-instrument');
  const subInstrument = readOption('sub-instrument');

  if (!VALID_INSTRUMENTS.has(mainInstrument)) {
    throw new Error('--main-instrument must be drum, bass, piano, front, or vocal');
  }
  if (mainInstrument === 'front' && !subInstrument) {
    throw new Error('--sub-instrument is required when --main-instrument=front');
  }

  const user = await prisma.userAccount.findUnique({
    where: { email },
    include: { memberProfile: true },
  });

  if (!user) {
    throw new Error(`UserAccount not found: ${email}`);
  }
  if (user.role !== 'admin') {
    throw new Error(`UserAccount is not an admin: ${email}`);
  }
  if (user.memberProfile) {
    console.log(JSON.stringify({
      applied: false,
      reason: 'member profile already exists',
      email,
      memberProfileId: user.memberProfile.id,
    }, null, 2));
    return;
  }

  const profileData = {
    displayName,
    mainInstrument,
    subInstrument: mainInstrument === 'front' ? subInstrument : null,
    gender: readOption('gender'),
    ageRange: readOption('age-range'),
    area: readOption('area'),
    bio: readOption('bio'),
  };

  if (!apply) {
    console.log(JSON.stringify({
      applied: false,
      dryRun: true,
      email,
      profile: profileData,
      nextStep: '内容を確認し、同じコマンドに --apply を付けて実行してください。',
    }, null, 2));
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const memberProfile = await tx.memberProfile.create({
      data: {
        userAccountId: user.id,
        ...profileData,
      },
    });

    const existingParticipant = await tx.participant.findFirst({
      where: {
        name: displayName,
        instrument: mainInstrument,
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    const participant = existingParticipant ?? await tx.participant.create({
      data: {
        name: displayName,
        instrument: mainInstrument,
      },
      select: { id: true },
    });

    return {
      memberProfileId: memberProfile.id,
      participantId: participant.id,
    };
  });

  console.log(JSON.stringify({
    applied: true,
    email,
    ...result,
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
