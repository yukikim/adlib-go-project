import './load-env.mjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeIdentityText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ja-JP');
}

function buildExactProfileFingerprint(member) {
  return [
    normalizeIdentityText(member.displayName),
    member.mainInstrument ?? '',
    member.area ?? '',
    member.gender ?? '',
    member.ageRange ?? '',
  ].join('|');
}

function buildDisplayNameFingerprint(member) {
  return normalizeIdentityText(member.displayName);
}

function groupMembers(members, buildFingerprint) {
  const grouped = new Map();

  for (const member of members) {
    const fingerprint = buildFingerprint(member);
    if (!fingerprint) {
      continue;
    }

    const existing = grouped.get(fingerprint) ?? [];
    existing.push({
      id: member.id,
      displayName: member.displayName,
      mainInstrument: member.mainInstrument,
      area: member.area,
      gender: member.gender,
      ageRange: member.ageRange,
      createdAt: member.createdAt,
      userAccount: member.userAccount,
    });
    grouped.set(fingerprint, existing);
  }

  return [...grouped.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([fingerprint, entries]) => ({ fingerprint, count: entries.length, members: entries }))
    .sort((left, right) => right.count - left.count || left.fingerprint.localeCompare(right.fingerprint, 'ja-JP'));
}

async function main() {
  const members = await prisma.memberProfile.findMany({
    include: {
      userAccount: {
        select: {
          id: true,
          email: true,
          emailVerifiedAt: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ displayName: 'asc' }, { createdAt: 'asc' }],
  });

  const exactProfileDuplicates = groupMembers(members, buildExactProfileFingerprint);
  const displayNameDuplicates = groupMembers(members, buildDisplayNameFingerprint);

  const report = {
    checkedAt: new Date().toISOString(),
    memberCount: members.length,
    summary: {
      exactProfileDuplicateGroups: exactProfileDuplicates.length,
      displayNameDuplicateGroups: displayNameDuplicates.length,
    },
    exactProfileDuplicates,
    displayNameDuplicates,
  };

  console.log(JSON.stringify(report, null, 2));

  if (exactProfileDuplicates.length > 0 || displayNameDuplicates.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });