import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { createSessionArchive } from '@/lib/sessionArchive';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { sessionArchiveCreateRequestSchema } from '@/lib/apiSchemas';

function stringArrayFromJson(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function ratingDistributionFromJson(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number',
    ),
  );
}

// GET /api/session-archives?includeDeleted=true
export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
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
    sets: archive.sets.map((set) => ({
      id: set.id,
      songTitle: set.songTitle,
      setOrder: set.setOrder,
      drumName: set.drumName,
      bassName: set.bassName,
      pianoName: set.pianoName,
      frontSnapshot: stringArrayFromJson(set.frontSnapshot),
      vocalSnapshot: stringArrayFromJson(set.vocalSnapshot),
      keyName: set.keyName,
      ratingSummary: set.ratingSummary
        ? {
            ratingCount: set.ratingSummary.ratingCount,
            averageRating: set.ratingSummary.averageRating,
            minRating: set.ratingSummary.minRating,
            maxRating: set.ratingSummary.maxRating,
            distribution: ratingDistributionFromJson(set.ratingSummary.distributionJson),
          }
        : null,
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

  const parsed = sessionArchiveCreateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const archive = await createSessionArchive({
      sessionEventId: body.sessionEventId,
      title: body.title ?? undefined,
      note: body.note ?? undefined,
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
