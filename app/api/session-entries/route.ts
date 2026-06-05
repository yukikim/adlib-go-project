import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMemberUser } from '@/lib/auth';
import { getRound1CandidateSongOptions, getSessionEventEntryState } from '@/lib/sessionEventWindow';
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

  const nextAfterPartyAttendanceStatus = sessionEvent.hasAfterParty
    ? body.afterPartyAttendanceStatus ?? null
    : null;
  const afterPartyAttendanceStatusUpdate = sessionEvent.hasAfterParty
    ? (body.afterPartyAttendanceStatus === undefined ? undefined : nextAfterPartyAttendanceStatus)
    : null;

  const entryState = getSessionEventEntryState(sessionEvent);
  if (!entryState.canSubmit || !entryState.round) {
    return NextResponse.json({ error: entryState.reason ?? 'Entry is not allowed' }, { status: 400 });
  }
  const activeRound = entryState.round;

  const requests = body.requests;
  if (requests.some((item) => item.round !== activeRound)) {
    return NextResponse.json(
      { error: `Only round=${activeRound} requests are accepted right now` },
      { status: 400 },
    );
  }

  const uniqueKeys = new Set(requests.map((item) => `${item.round}:${item.songTitle.toLowerCase()}`));
  if (uniqueKeys.size !== requests.length) {
    return NextResponse.json({ error: 'Duplicate song requests are not allowed' }, { status: 400 });
  }

  const memberProfile = auth.user.memberProfile!;
  if (memberProfile.mainInstrument === 'vocal' && activeRound === 1 && requests.some((item) => !item.keyName)) {
    return NextResponse.json({ error: 'keyName is required for vocal' }, { status: 400 });
  }

  let persistedRequests = requests;

  if (activeRound === 2) {
    const round1Entries = await prisma.sessionEntry.findMany({
      where: { sessionEventId: body.sessionEventId },
      select: {
        attendanceStatus: true,
        requests: {
          where: { round: 1 },
          orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
          select: {
            round: true,
            songTitleSnapshot: true,
            keyName: true,
          },
        },
      },
    });
    const candidateOptions = getRound1CandidateSongOptions(round1Entries);
    const candidateByTitle = new Map(candidateOptions.map((candidate) => [candidate.candidateSong, candidate]));

    if (requests.some((item) => !candidateByTitle.has(item.songTitle))) {
      return NextResponse.json({
        error: 'Round2 では round1 の集計候補曲から選択してください',
        candidateSongs: candidateOptions.map((candidate) => candidate.candidateSong),
      }, { status: 400 });
    }

    persistedRequests = requests.map((item) => {
      const candidate = candidateByTitle.get(item.songTitle);
      if (!candidate) {
        return item;
      }

      return {
        ...item,
        songTitle: candidate.songTitle,
        keyName: item.keyName ?? candidate.keyName,
      };
    });
  }

  const round1Count = persistedRequests.filter((item) => item.round === 1).length;
  const round2Count = persistedRequests.filter((item) => item.round === 2).length;

  if (memberProfile.mainInstrument === 'vocal') {
    if (round1Count > 2 || round2Count > 1 || persistedRequests.length > 3) {
      return NextResponse.json({ error: 'Vocal request limits exceeded' }, { status: 400 });
    }
  } else if (round1Count > 2 || round2Count > 2 || persistedRequests.length > 4) {
    return NextResponse.json({ error: 'Request limits exceeded' }, { status: 400 });
  }

  const existingSongs = await prisma.song.findMany({
    where: { title: { in: persistedRequests.map((item) => item.songTitle) } },
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
        ...(afterPartyAttendanceStatusUpdate !== undefined
          ? { afterPartyAttendanceStatus: afterPartyAttendanceStatusUpdate }
          : {}),
      },
      create: {
        sessionEventId: body.sessionEventId!,
        memberProfileId: memberProfile.id,
        attendanceStatus: body.attendanceStatus,
        afterPartyAttendanceStatus: nextAfterPartyAttendanceStatus,
      },
    });

    await tx.sessionEntryRequest.deleteMany({
      where: {
        sessionEntryId: upsertedEntry.id,
        round: activeRound,
      },
    });

    for (const item of persistedRequests.sort((a, b) => a.priority - b.priority)) {
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