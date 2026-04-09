import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMemberUser } from '@/lib/auth';
import { getSessionEventEntryState } from '@/lib/sessionEventWindow';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { sessionEntryCreateRequestSchema } from '@/lib/apiSchemas';

export async function GET(request: NextRequest) {
  const auth = await requireMemberUser(request);
  if ('response' in auth) {
    return auth.response;
  }

  const sessionEventId = request.nextUrl.searchParams.get('sessionEventId');

  const entries = await prisma.sessionEntry.findMany({
    where: {
      memberProfileId: auth.user.memberProfile!.id,
      ...(sessionEventId ? { sessionEventId } : {}),
    },
    include: {
      sessionEvent: true,
      requests: {
        orderBy: [{ round: 'asc' }, { priority: 'asc' }],
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const auth = await requireMemberUser(request);
  if ('response' in auth) {
    return auth.response;
  }

  const parsed = sessionEntryCreateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const sessionEvent = await prisma.sessionEvent.findUnique({ where: { id: body.sessionEventId } });
  if (!sessionEvent) {
    return NextResponse.json({ error: 'SessionEvent not found' }, { status: 404 });
  }

  const entryState = getSessionEventEntryState(sessionEvent);
  if (!entryState.canSubmit || !entryState.round) {
    return NextResponse.json({ error: entryState.reason ?? 'Entry is not allowed' }, { status: 400 });
  }

  const requests = body.requests;
  if (requests.some((item) => item.round !== entryState.round)) {
    return NextResponse.json(
      { error: `Only round=${entryState.round} requests are accepted right now` },
      { status: 400 },
    );
  }

  const uniqueKeys = new Set(requests.map((item) => `${item.round}:${item.songTitle.toLowerCase()}`));
  if (uniqueKeys.size !== requests.length) {
    return NextResponse.json({ error: 'Duplicate song requests are not allowed' }, { status: 400 });
  }

  const memberProfile = auth.user.memberProfile!;
  if (memberProfile.mainInstrument === 'vocal' && requests.some((item) => !item.keyName)) {
    return NextResponse.json({ error: 'keyName is required for vocal' }, { status: 400 });
  }

  const round1Count = requests.filter((item) => item.round === 1).length;
  const round2Count = requests.filter((item) => item.round === 2).length;

  if (memberProfile.mainInstrument === 'vocal') {
    if (round1Count > 2 || round2Count > 1 || requests.length > 3) {
      return NextResponse.json({ error: 'Vocal request limits exceeded' }, { status: 400 });
    }
  } else if (round1Count > 2 || round2Count > 2 || requests.length > 4) {
    return NextResponse.json({ error: 'Request limits exceeded' }, { status: 400 });
  }

  const existingSongs = await prisma.song.findMany({
    where: { title: { in: requests.map((item) => item.songTitle) } },
    select: { id: true, title: true },
  });
  const songByTitle = new Map(existingSongs.map((song) => [song.title, song]));

  const entry = await prisma.$transaction(async (tx) => {
    const upsertedEntry = await tx.sessionEntry.upsert({
      where: {
        sessionEventId_memberProfileId: {
          sessionEventId: body.sessionEventId!,
          memberProfileId: memberProfile.id,
        },
      },
      update: {
        attendanceStatus: body.attendanceStatus,
      },
      create: {
        sessionEventId: body.sessionEventId!,
        memberProfileId: memberProfile.id,
        attendanceStatus: body.attendanceStatus,
      },
    });

    await tx.sessionEntryRequest.deleteMany({
      where: {
        sessionEntryId: upsertedEntry.id,
        round: entryState.round,
      },
    });

    for (const item of requests.sort((a, b) => a.priority - b.priority)) {
      let song = songByTitle.get(item.songTitle);
      if (!song && item.round === 1) {
        song = await tx.song.create({ data: { title: item.songTitle } });
        songByTitle.set(song.title, song);
      }

      if (!song) {
        throw new Error(`Song must be chosen from existing titles for round=2: ${item.songTitle}`);
      }

      await tx.sessionEntryRequest.create({
        data: {
          sessionEntryId: upsertedEntry.id,
          songId: song.id,
          songTitleSnapshot: song.title,
          keyName: item.keyName ?? null,
          round: item.round,
          priority: item.priority,
        },
      });
    }

    return tx.sessionEntry.findUniqueOrThrow({
      where: { id: upsertedEntry.id },
      include: {
        sessionEvent: true,
        requests: {
          orderBy: [{ round: 'asc' }, { priority: 'asc' }],
        },
      },
    });
  });

  return NextResponse.json({ entry }, { status: 201 });
}