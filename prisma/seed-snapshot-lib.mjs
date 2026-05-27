import './load-env.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_SNAPSHOT_PATH = 'prisma/current-db-seed.snapshot.json';

export const SNAPSHOT_MODELS = [
  { key: 'participants', model: 'participant', dateFields: [] },
  { key: 'songs', model: 'song', dateFields: [] },
  { key: 'participantSongRequests', model: 'participantSongRequest', dateFields: [] },
  { key: 'userAccounts', model: 'userAccount', dateFields: ['emailVerifiedAt', 'lastSignedInAt', 'createdAt', 'updatedAt'] },
  { key: 'memberProfiles', model: 'memberProfile', dateFields: ['createdAt', 'updatedAt'] },
  { key: 'sessionEvents', model: 'sessionEvent', dateFields: ['eventDate', 'startTime', 'endTime', 'round1StartAt', 'round1EndAt', 'round2StartAt', 'round2EndAt', 'createdAt', 'updatedAt'] },
  { key: 'sessionSetDrafts', model: 'sessionSetDraft', dateFields: ['createdAt', 'updatedAt'] },
  { key: 'sessionEntries', model: 'sessionEntry', dateFields: ['createdAt', 'updatedAt'] },
  { key: 'sessionEntryRequests', model: 'sessionEntryRequest', dateFields: ['createdAt', 'updatedAt'] },
  { key: 'sessionSets', model: 'sessionSet', dateFields: ['createdAt', 'updatedAt'] },
  { key: 'sessionSetMembers', model: 'sessionSetMember', dateFields: [] },
  { key: 'sessionSetRatings', model: 'sessionSetRating', dateFields: ['ratedAt', 'updatedAt'] },
  { key: 'sessionEventComments', model: 'sessionEventComment', dateFields: ['createdAt', 'updatedAt'] },
  { key: 'sessionArchives', model: 'sessionArchive', dateFields: ['eventDate', 'deletedAt', 'createdAt'] },
  { key: 'sessionArchiveParticipants', model: 'sessionArchiveParticipant', dateFields: [] },
  { key: 'sessionArchiveSets', model: 'sessionArchiveSet', dateFields: [] },
  { key: 'sessionArchiveRatingSummaries', model: 'sessionArchiveRatingSummary', dateFields: [] },
  { key: 'adminAuditLogs', model: 'adminAuditLog', dateFields: ['performedAt'] },
  { key: 'authSessions', model: 'authSession', dateFields: ['expiresAt', 'lastAccessedAt', 'createdAt'] },
  { key: 'passwordResetTokens', model: 'passwordResetToken', dateFields: ['expiresAt', 'usedAt', 'createdAt'] },
  { key: 'emailVerificationTokens', model: 'emailVerificationToken', dateFields: ['expiresAt', 'usedAt', 'createdAt'] },
  { key: 'announcements', model: 'announcement', dateFields: ['publishedAt', 'createdAt', 'updatedAt'] },
  { key: 'mailLogs', model: 'mailLog', dateFields: ['createdAt', 'sentAt'] },
  { key: 'columns', model: 'column', dateFields: ['publishedAt', 'createdAt', 'updatedAt'] },
];

export const DELETE_MODEL_ORDER = [
  'column',
  'mailLog',
  'announcement',
  'emailVerificationToken',
  'passwordResetToken',
  'authSession',
  'adminAuditLog',
  'sessionArchiveRatingSummary',
  'sessionArchiveSet',
  'sessionArchiveParticipant',
  'sessionArchive',
  'sessionEventComment',
  'sessionSetRating',
  'sessionSetMember',
  'sessionSet',
  'sessionEntryRequest',
  'sessionEntry',
  'sessionSetDraft',
  'memberProfile',
  'userAccount',
  'sessionEvent',
  'participantSongRequest',
  'participant',
  'song',
];

export const INSERT_MODEL_ORDER = SNAPSHOT_MODELS.map((config) => config.model);

export function resolveSnapshotPath(customPath) {
  return path.resolve(process.cwd(), customPath || DEFAULT_SNAPSHOT_PATH);
}

function convertDateFields(record, dateFields) {
  if (!dateFields.length) {
    return record;
  }

  const converted = { ...record };
  for (const field of dateFields) {
    const value = converted[field];
    if (value === null || value === undefined || value instanceof Date) {
      continue;
    }
    converted[field] = new Date(value);
  }

  return converted;
}

export async function clearSeedTables(prisma) {
  await prisma.$transaction(async (tx) => {
    for (const model of DELETE_MODEL_ORDER) {
      await tx[model].deleteMany();
    }
  });
}

export async function exportSnapshot(prisma, snapshotPath) {
  const snapshot = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {},
  };

  for (const config of SNAPSHOT_MODELS) {
    snapshot.data[config.key] = await prisma[config.model].findMany({
      orderBy: { id: 'asc' },
    });
  }

  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  await fs.writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  return snapshot;
}

export async function readSnapshot(snapshotPath) {
  const raw = await fs.readFile(snapshotPath, 'utf8');
  return JSON.parse(raw);
}

export async function restoreSnapshot(prisma, snapshot) {
  await clearSeedTables(prisma);

  for (const config of SNAPSHOT_MODELS) {
    const rows = snapshot.data?.[config.key] ?? [];
    if (!rows.length) {
      continue;
    }

    await prisma[config.model].createMany({
      data: rows.map((row) => convertDateFields(row, config.dateFields)),
    });
  }
}

export function buildSnapshotCounts(snapshot) {
  return Object.fromEntries(
    SNAPSHOT_MODELS.map((config) => [config.key, snapshot.data?.[config.key]?.length ?? 0]),
  );
}