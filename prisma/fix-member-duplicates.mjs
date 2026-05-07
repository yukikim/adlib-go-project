import './load-env.mjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const applyChanges = process.argv.includes('--apply');

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

function buildRequestFingerprint(request) {
  return [request.round, request.priority, request.songId ?? '', request.songTitleSnapshot, request.keyName ?? ''].join('|');
}

function getEmailScore(email) {
  if (email.endsWith('@adlib-go.local')) {
    return 2;
  }
  if (email.endsWith('@adolib-go.local')) {
    return 1;
  }
  return 0;
}

function getActivityScore(member) {
  return member.sessionEntries.length
    + member.userAccount.sessionRatings.length
    + member.userAccount.sessionArchives.length
    + member.userAccount.adminAuditLogs.length
    + member.userAccount.announcements.length
    + member.userAccount.columns.length
    + member.userAccount.mailLogs.length;
}

function compareMembers(left, right) {
  const roleDelta = Number(right.userAccount.role === 'admin') - Number(left.userAccount.role === 'admin');
  if (roleDelta !== 0) {
    return roleDelta;
  }

  const verifiedDelta = Number(Boolean(right.userAccount.emailVerifiedAt)) - Number(Boolean(left.userAccount.emailVerifiedAt));
  if (verifiedDelta !== 0) {
    return verifiedDelta;
  }

  const emailDelta = getEmailScore(right.userAccount.email) - getEmailScore(left.userAccount.email);
  if (emailDelta !== 0) {
    return emailDelta;
  }

  const activityDelta = getActivityScore(right) - getActivityScore(left);
  if (activityDelta !== 0) {
    return activityDelta;
  }

  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime() || left.id.localeCompare(right.id, 'ja-JP');
}

function groupMembers(members) {
  const grouped = new Map();

  for (const member of members) {
    const fingerprint = buildExactProfileFingerprint(member);
    if (!fingerprint) {
      continue;
    }

    const existing = grouped.get(fingerprint) ?? [];
    existing.push(member);
    grouped.set(fingerprint, existing);
  }

  return [...grouped.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([fingerprint, entries]) => {
      const sorted = [...entries].sort(compareMembers);
      return {
        fingerprint,
        keeper: sorted[0],
        duplicates: sorted.slice(1),
      };
    })
    .sort((left, right) => right.duplicates.length - left.duplicates.length || left.fingerprint.localeCompare(right.fingerprint, 'ja-JP'));
}

async function mergeSessionEntries(tx, keeperProfileId, duplicateProfileId) {
  const duplicateEntries = await tx.sessionEntry.findMany({
    where: { memberProfileId: duplicateProfileId },
    include: {
      requests: {
        orderBy: [{ round: 'asc' }, { priority: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: [{ createdAt: 'asc' }],
  });

  const counters = {
    movedSessionEntries: 0,
    mergedSessionEntries: 0,
    movedSessionEntryRequests: 0,
    deletedSessionEntryRequests: 0,
    deletedSessionEntries: 0,
  };

  for (const duplicateEntry of duplicateEntries) {
    const keeperEntry = await tx.sessionEntry.findUnique({
      where: {
        sessionEventId_memberProfileId: {
          sessionEventId: duplicateEntry.sessionEventId,
          memberProfileId: keeperProfileId,
        },
      },
      include: {
        requests: true,
      },
    });

    if (!keeperEntry) {
      await tx.sessionEntry.update({
        where: { id: duplicateEntry.id },
        data: { memberProfileId: keeperProfileId },
      });
      counters.movedSessionEntries += 1;
      continue;
    }

    const requestFingerprints = new Set(keeperEntry.requests.map(buildRequestFingerprint));
    for (const request of duplicateEntry.requests) {
      const fingerprint = buildRequestFingerprint(request);
      if (requestFingerprints.has(fingerprint)) {
        await tx.sessionEntryRequest.delete({ where: { id: request.id } });
        counters.deletedSessionEntryRequests += 1;
        continue;
      }

      await tx.sessionEntryRequest.update({
        where: { id: request.id },
        data: { sessionEntryId: keeperEntry.id },
      });
      requestFingerprints.add(fingerprint);
      counters.movedSessionEntryRequests += 1;
    }

    await tx.sessionEntry.delete({ where: { id: duplicateEntry.id } });
    counters.mergedSessionEntries += 1;
    counters.deletedSessionEntries += 1;
  }

  return counters;
}

async function mergeSessionRatings(tx, keeperUserId, duplicateUserId) {
  const duplicateRatings = await tx.sessionSetRating.findMany({
    where: { userAccountId: duplicateUserId },
    orderBy: [{ ratedAt: 'asc' }],
  });

  const counters = {
    movedSessionRatings: 0,
    mergedSessionRatings: 0,
    deletedSessionRatings: 0,
  };

  for (const rating of duplicateRatings) {
    const keeperRating = await tx.sessionSetRating.findUnique({
      where: {
        sessionSetId_userAccountId: {
          sessionSetId: rating.sessionSetId,
          userAccountId: keeperUserId,
        },
      },
    });

    if (!keeperRating) {
      await tx.sessionSetRating.update({
        where: { id: rating.id },
        data: { userAccountId: keeperUserId },
      });
      counters.movedSessionRatings += 1;
      continue;
    }

    if (!keeperRating.comment && rating.comment) {
      await tx.sessionSetRating.update({
        where: { id: keeperRating.id },
        data: {
          rating: rating.rating,
          comment: rating.comment,
          ratedAt: rating.ratedAt,
        },
      });
    }

    await tx.sessionSetRating.delete({ where: { id: rating.id } });
    counters.mergedSessionRatings += 1;
    counters.deletedSessionRatings += 1;
  }

  return counters;
}

function buildUserPatch(keeper, duplicate) {
  const patch = {};

  if (duplicate.userAccount.role === 'admin' && keeper.userAccount.role !== 'admin') {
    patch.role = 'admin';
  }

  if (duplicate.userAccount.status === 'active' && keeper.userAccount.status !== 'active') {
    patch.status = 'active';
  }

  if (duplicate.userAccount.emailVerifiedAt) {
    if (!keeper.userAccount.emailVerifiedAt || new Date(duplicate.userAccount.emailVerifiedAt) < new Date(keeper.userAccount.emailVerifiedAt)) {
      patch.emailVerifiedAt = duplicate.userAccount.emailVerifiedAt;
    }
  }

  if (duplicate.userAccount.lastSignedInAt) {
    if (!keeper.userAccount.lastSignedInAt || new Date(duplicate.userAccount.lastSignedInAt) > new Date(keeper.userAccount.lastSignedInAt)) {
      patch.lastSignedInAt = duplicate.userAccount.lastSignedInAt;
    }
  }

  return patch;
}

function buildProfilePatch(keeper, duplicate) {
  const patch = {};

  if (!keeper.nickname && duplicate.nickname) {
    patch.nickname = duplicate.nickname;
  }

  if (!keeper.subInstrument && duplicate.subInstrument) {
    patch.subInstrument = duplicate.subInstrument;
  }

  if (!keeper.bio && duplicate.bio) {
    patch.bio = duplicate.bio;
  }

  return patch;
}

async function mergeDuplicateIntoKeeper(tx, keeperId, duplicateId) {
  const keeper = await tx.memberProfile.findUniqueOrThrow({
    where: { id: keeperId },
    include: {
      userAccount: true,
    },
  });
  const duplicate = await tx.memberProfile.findUniqueOrThrow({
    where: { id: duplicateId },
    include: {
      userAccount: true,
    },
  });

  const userPatch = buildUserPatch(keeper, duplicate);
  if (Object.keys(userPatch).length > 0) {
    await tx.userAccount.update({
      where: { id: keeper.userAccountId },
      data: userPatch,
    });
  }

  const profilePatch = buildProfilePatch(keeper, duplicate);
  if (Object.keys(profilePatch).length > 0) {
    await tx.memberProfile.update({
      where: { id: keeper.id },
      data: profilePatch,
    });
  }

  const sessionEntryCounters = await mergeSessionEntries(tx, keeper.id, duplicate.id);
  const sessionRatingCounters = await mergeSessionRatings(tx, keeper.userAccountId, duplicate.userAccountId);

  const [sessionArchives, adminAuditLogs, announcements, columns, mailLogs] = await Promise.all([
    tx.sessionArchive.updateMany({ where: { createdById: duplicate.userAccountId }, data: { createdById: keeper.userAccountId } }),
    tx.adminAuditLog.updateMany({ where: { performedById: duplicate.userAccountId }, data: { performedById: keeper.userAccountId } }),
    tx.announcement.updateMany({ where: { createdById: duplicate.userAccountId }, data: { createdById: keeper.userAccountId } }),
    tx.column.updateMany({ where: { createdById: duplicate.userAccountId }, data: { createdById: keeper.userAccountId } }),
    tx.mailLog.updateMany({ where: { createdById: duplicate.userAccountId }, data: { createdById: keeper.userAccountId } }),
  ]);

  const [authSessions, passwordResetTokens, emailVerificationTokens] = await Promise.all([
    tx.authSession.deleteMany({ where: { userAccountId: duplicate.userAccountId } }),
    tx.passwordResetToken.deleteMany({ where: { userAccountId: duplicate.userAccountId } }),
    tx.emailVerificationToken.deleteMany({ where: { userAccountId: duplicate.userAccountId } }),
  ]);

  await tx.userAccount.delete({ where: { id: duplicate.userAccountId } });

  return {
    ...sessionEntryCounters,
    ...sessionRatingCounters,
    reassignedSessionArchives: sessionArchives.count,
    reassignedAdminAuditLogs: adminAuditLogs.count,
    reassignedAnnouncements: announcements.count,
    reassignedColumns: columns.count,
    reassignedMailLogs: mailLogs.count,
    deletedAuthSessions: authSessions.count,
    deletedPasswordResetTokens: passwordResetTokens.count,
    deletedEmailVerificationTokens: emailVerificationTokens.count,
    deletedUserAccounts: 1,
    deletedMemberProfiles: 1,
  };
}

function summarizePlan(groups) {
  return groups.map((group) => ({
    fingerprint: group.fingerprint,
    keeper: {
      id: group.keeper.id,
      displayName: group.keeper.displayName,
      email: group.keeper.userAccount.email,
      role: group.keeper.userAccount.role,
      createdAt: group.keeper.createdAt,
    },
    duplicates: group.duplicates.map((duplicate) => ({
      id: duplicate.id,
      displayName: duplicate.displayName,
      email: duplicate.userAccount.email,
      role: duplicate.userAccount.role,
      createdAt: duplicate.createdAt,
    })),
  }));
}

async function main() {
  const members = await prisma.memberProfile.findMany({
    include: {
      sessionEntries: {
        select: { id: true },
      },
      userAccount: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          emailVerifiedAt: true,
          lastSignedInAt: true,
          sessionRatings: { select: { id: true } },
          sessionArchives: { select: { id: true } },
          adminAuditLogs: { select: { id: true } },
          announcements: { select: { id: true } },
          columns: { select: { id: true } },
          mailLogs: { select: { id: true } },
        },
      },
    },
    orderBy: [{ displayName: 'asc' }, { createdAt: 'asc' }],
  });

  const duplicateGroups = groupMembers(members);
  const baseReport = {
    applied: applyChanges,
    duplicateGroupCount: duplicateGroups.length,
    duplicateMemberCount: duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0),
    plan: summarizePlan(duplicateGroups),
  };

  if (!applyChanges) {
    console.log(JSON.stringify({
      ...baseReport,
      message: 'Dry run only. Re-run with --apply to merge duplicates.',
    }, null, 2));
    if (duplicateGroups.length > 0) {
      process.exitCode = 1;
    }
    return;
  }

  const operations = [];
  for (const group of duplicateGroups) {
    const counters = {
      movedSessionEntries: 0,
      mergedSessionEntries: 0,
      movedSessionEntryRequests: 0,
      deletedSessionEntryRequests: 0,
      deletedSessionEntries: 0,
      movedSessionRatings: 0,
      mergedSessionRatings: 0,
      deletedSessionRatings: 0,
      reassignedSessionArchives: 0,
      reassignedAdminAuditLogs: 0,
      reassignedAnnouncements: 0,
      reassignedColumns: 0,
      reassignedMailLogs: 0,
      deletedAuthSessions: 0,
      deletedPasswordResetTokens: 0,
      deletedEmailVerificationTokens: 0,
      deletedUserAccounts: 0,
      deletedMemberProfiles: 0,
    };

    for (const duplicate of group.duplicates) {
      const result = await prisma.$transaction((tx) => mergeDuplicateIntoKeeper(tx, group.keeper.id, duplicate.id));
      for (const [key, value] of Object.entries(result)) {
        counters[key] += value;
      }
    }

    operations.push({
      fingerprint: group.fingerprint,
      keeperId: group.keeper.id,
      mergedDuplicateCount: group.duplicates.length,
      counters,
    });
  }

  console.log(JSON.stringify({
    ...baseReport,
    operations,
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