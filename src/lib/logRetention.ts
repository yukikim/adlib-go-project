import { prisma } from '@/lib/prisma';

export const LOG_RETENTION_MONTHS = 3;

export function getLogRetentionCutoff(now = new Date()) {
  const cutoff = new Date(now);
  const originalDay = cutoff.getUTCDate();

  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - LOG_RETENTION_MONTHS);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0),
  ).getUTCDate();
  cutoff.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));

  return cutoff;
}

export async function deleteExpiredLogs(now = new Date()) {
  const cutoff = getLogRetentionCutoff(now);
  const [adminAuditLogs, mailLogs] = await prisma.$transaction([
    prisma.adminAuditLog.deleteMany({
      where: {
        performedAt: {
          lt: cutoff,
        },
      },
    }),
    prisma.mailLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    }),
  ]);

  return {
    cutoff,
    deleted: {
      adminAuditLogs: adminAuditLogs.count,
      mailLogs: mailLogs.count,
    },
  };
}
