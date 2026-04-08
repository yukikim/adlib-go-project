import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { createSessionArchive } from '@/lib/sessionArchive';

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

export async function POST(request: NextRequest) {
  const { admin, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const body = (await request.json().catch(() => null)) as {
    sessionEventId?: string;
    title?: string;
    note?: string | null;
  } | null;

  if (!body?.sessionEventId) {
    return NextResponse.json({ error: 'sessionEventId is required' }, { status: 400 });
  }

  try {
    const archive = await createSessionArchive({
      sessionEventId: body.sessionEventId,
      title: body.title,
      note: body.note,
      createdById: admin!.userId,
    });

    return NextResponse.json({ archive }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create archive' },
      { status: 400 },
    );
  }
}