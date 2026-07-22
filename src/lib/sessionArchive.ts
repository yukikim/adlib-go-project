import { prisma } from '@/lib/prisma';

function buildDistribution(values: number[]) {
  const distribution: Record<string, number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  };

  for (const value of values) {
    distribution[String(value)] = (distribution[String(value)] ?? 0) + 1;
  }

  return distribution;
}

export async function buildArchivePreview(sessionEventId: string) {
  const sessionEvent = await prisma.sessionEvent.findUnique({
    where: { id: sessionEventId },
    include: {
      sessionEntries: {
        where: { attendanceStatus: 'attending' },
        include: { memberProfile: true },
      },
      sessionSets: {
        where: { isPublished: true },
        include: {
          ratings: true,
        },
        orderBy: [{ setOrder: 'asc' }, { title: 'asc' }],
      },
    },
  });

  if (!sessionEvent) {
    throw new Error('SessionEvent not found');
  }

  return {
    sessionEvent,
    participantCount: sessionEvent.sessionEntries.length,
    setCount: sessionEvent.sessionSets.length,
    ratingSummaryIncluded: sessionEvent.sessionSets.some((set) => set.ratings.length > 0),
  };
}

export async function createSessionArchive(params: {
  sessionEventId: string;
  title?: string;
  note?: string | null;
  createdById: string;
}) {
  const preview = await buildArchivePreview(params.sessionEventId);

  // UIを経由しない直接API呼び出しでも、運用ルールと同じく終了イベントだけを保存対象にする。
  if (preview.sessionEvent.status !== 'closed') {
    throw new Error('Only closed session events can be archived');
  }

  if (preview.setCount === 0) {
    throw new Error('No published session sets found for this event');
  }

  return prisma.$transaction(async (tx) => {
    const latestArchive = await tx.sessionArchive.findFirst({
      where: { sessionEventId: params.sessionEventId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const archive = await tx.sessionArchive.create({
      data: {
        sessionEventId: preview.sessionEvent.id,
        version: (latestArchive?.version ?? 0) + 1,
        title: params.title?.trim() || `${preview.sessionEvent.title} アーカイブ`,
        eventDate: preview.sessionEvent.eventDate,
        venue: preview.sessionEvent.venue,
        participantCount: preview.participantCount,
        note: params.note?.trim() || null,
        createdById: params.createdById,
      },
    });

    for (const entry of preview.sessionEvent.sessionEntries) {
      await tx.sessionArchiveParticipant.create({
        data: {
          sessionArchiveId: archive.id,
          displayName: entry.memberProfile.displayName,
          mainInstrument: entry.memberProfile.mainInstrument,
        },
      });
    }

    for (const sessionSet of preview.sessionEvent.sessionSets) {
      const persistedSet = await tx.sessionSet.findUniqueOrThrow({
        where: { id: sessionSet.id },
        include: {
          drum: true,
          bass: true,
          piano: true,
          members: {
            include: { participant: true },
          },
          ratings: true,
        },
      });

      const archiveSet = await tx.sessionArchiveSet.create({
        data: {
          sessionArchiveId: archive.id,
          songTitle: persistedSet.title,
          setOrder: persistedSet.setOrder,
          drumName: persistedSet.drum?.name ?? null,
          bassName: persistedSet.bass?.name ?? null,
          pianoName: persistedSet.piano?.name ?? null,
          frontSnapshot: persistedSet.members
            .filter((member) => member.role === 'front')
            .map((member) => member.participant.name),
          vocalSnapshot: persistedSet.members
            .filter((member) => member.role === 'vocal')
            .map((member) => member.participant.name),
          keyName: persistedSet.keyName,
        },
      });

      const values = persistedSet.ratings.map((rating) => rating.rating);
      const ratingCount = values.length;
      const averageRating = ratingCount === 0 ? null : values.reduce((sum, value) => sum + value, 0) / ratingCount;

      await tx.sessionArchiveRatingSummary.create({
        data: {
          sessionArchiveSetId: archiveSet.id,
          ratingCount,
          averageRating,
          minRating: ratingCount === 0 ? null : Math.min(...values),
          maxRating: ratingCount === 0 ? null : Math.max(...values),
          distributionJson: buildDistribution(values),
        },
      });
    }

    await tx.adminAuditLog.create({
      data: {
        action: 'archive_created',
        targetType: 'SessionArchive',
        targetId: archive.id,
        summary: `Created archive version ${archive.version}`,
        payload: {
          sessionEventId: preview.sessionEvent.id,
          title: archive.title,
          participantCount: preview.participantCount,
          setCount: preview.setCount,
        },
        performedById: params.createdById,
        sessionArchiveId: archive.id,
      },
    });

    return archive;
  });
}
