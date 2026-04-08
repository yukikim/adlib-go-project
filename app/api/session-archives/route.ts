import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';

// GET /api/session-archives?includeDeleted=true
export async function GET(request: NextRequest) {
  const { admin, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const includeDeleted = request.nextUrl.searchParams.get('includeDeleted') === 'true';

  const archives = await prisma.sessionArchive.findMany({
    where: includeDeleted ? undefined : { deletedAt: null },
    include: {
      sessionEvent: {
        select: {
          id: true,
          title: true,
        },
      },
      participants: {
        orderBy: { displayName: 'asc' },
      },
      sets: {
        include: {
          ratingSummary: true,
        },
        orderBy: [{ setOrder: 'asc' }, { songTitle: 'asc' }],
      },
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: [{ eventDate: 'desc' }, { version: 'desc' }],
  });

  const data = archives.map((archive) => ({
    id: archive.id,
    sessionEventId: archive.sessionEventId,
    sessionEventTitle: archive.sessionEvent?.title ?? archive.title,
    title: archive.title,
    version: archive.version,
    eventDate: archive.eventDate,
    venue: archive.venue,
    participantCount: archive.participantCount,
    participants: archive.participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      mainInstrument: participant.mainInstrument,
    })),
    setCount: archive.sets.length,
    ratingCount: archive.sets.reduce(
      (total, set) => total + (set.ratingSummary?.ratingCount ?? 0),
      0,
    ),
    deletedAt: archive.deletedAt,
    createdAt: archive.createdAt,
    createdBy: archive.createdBy,
  }));

  return NextResponse.json({ archives: data, includeDeleted });
}