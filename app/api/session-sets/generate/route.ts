import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Prisma, type MemberRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { generateSessionSets } from '@/session-planner/generateSessionSets';
import type { Participant as DomainParticipant } from '@/session-planner/domain';
import { requireAdmin } from '@/lib/adminApi';
import { getSessionEventLifecycleState } from '@/lib/sessionEventWindow';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { sessionSetGenerateRequestSchema } from '@/lib/apiSchemas';
import { serializeSessionSets } from '@/lib/sessionSets';

function buildParticipantKey(name: string, instrument: string) {
  return `${name}::${instrument}`;
}

export async function POST(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) {
    return response;
  }

  const parsed = sessionSetGenerateRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const sessionEvent = await prisma.sessionEvent.findUnique({
    where: { id: body.sessionEventId },
    include: {
      sessionEntries: {
        where: { attendanceStatus: 'attending' },
        include: {
          memberProfile: true,
          requests: {
            orderBy: [{ round: 'asc' }, { priority: 'asc' }],
          },
        },
      },
    },
  });

  if (!sessionEvent) {
    return NextResponse.json({ error: 'SessionEvent not found' }, { status: 404 });
  }

  const lifecycle = getSessionEventLifecycleState(sessionEvent);
  if (!lifecycle.canGenerateSessionSets) {
    return NextResponse.json({ error: lifecycle.reason ?? 'SessionEvent is not ready for sessionSet generation' }, { status: 400 });
  }

  const participants = await prisma.participant.findMany({
    select: { id: true, name: true, instrument: true },
  });

  const participantByKey = new Map(
    participants.map((participant) => [
      buildParticipantKey(participant.name, participant.instrument),
      participant,
    ]),
  );
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));

  const missingParticipantMappings = sessionEvent.sessionEntries
    .filter((entry) => !participantByKey.has(buildParticipantKey(entry.memberProfile.displayName, entry.memberProfile.mainInstrument)))
    .map((entry) => ({
      displayName: entry.memberProfile.displayName,
      instrument: entry.memberProfile.mainInstrument,
    }));

  if (missingParticipantMappings.length > 0) {
    return NextResponse.json({
      error: 'Some attending members could not be mapped to planner participants',
      missingParticipants: missingParticipantMappings,
    }, { status: 400 });
  }

  const domainParticipants: DomainParticipant[] = sessionEvent.sessionEntries.map((entry) => {
    const participant = participantByKey.get(
      buildParticipantKey(entry.memberProfile.displayName, entry.memberProfile.mainInstrument),
    );

    if (!participant) {
      throw new Error(`Missing participant mapping for ${entry.memberProfile.displayName} (${entry.memberProfile.mainInstrument})`);
    }

    return {
      id: participant.id,
      name: participant.name,
      instrument: participant.instrument as DomainParticipant['instrument'],
      requestedSongs: entry.requests.map((request) => ({
        title: request.songTitleSnapshot,
        key: request.keyName ?? undefined,
        round: request.round === 2 ? 2 : 1,
      })),
    };
  });

  if (domainParticipants.length === 0) {
    return NextResponse.json({ error: 'No participating members could be mapped to planner participants' }, { status: 400 });
  }

  const { sessionSets, skippedSongs, forcedSessionSets } = generateSessionSets(domainParticipants);

  const generatedSongTitles = [...new Set(sessionSets.map((sessionSet) => sessionSet.songTitle))];
  const songs = generatedSongTitles.length === 0
    ? []
    : await prisma.song.findMany({
        where: { title: { in: generatedSongTitles } },
        select: { id: true, title: true },
      });
  const songByTitle = new Map(songs.map((song) => [song.title, song]));
  const missingSongs = generatedSongTitles.filter((songTitle) => !songByTitle.has(songTitle));

  if (missingSongs.length > 0) {
    return NextResponse.json({
      error: 'Generated sessionSets reference songs that do not exist in Song table',
      missingSongs,
    }, { status: 400 });
  }

  const assignedParticipantIds = [...new Set(sessionSets.flatMap((sessionSet) => [
    sessionSet.drum,
    sessionSet.bass,
    sessionSet.piano,
    ...sessionSet.front,
  ].filter((value): value is string => Boolean(value))))];
  const missingAssignedParticipants = assignedParticipantIds.filter((participantId) => !participantById.has(participantId));

  if (missingAssignedParticipants.length > 0) {
    return NextResponse.json({
      error: 'Generated sessionSets reference participants that do not exist in Participant table',
      missingParticipantIds: missingAssignedParticipants,
    }, { status: 400 });
  }

  const sessionSetRows = sessionSets.map((sessionSet, index) => {
    const song = songByTitle.get(sessionSet.songTitle);
    if (!song) {
      throw new Error(`Missing Song row for ${sessionSet.songTitle}`);
    }

    return {
      id: randomUUID(),
      sessionEventId: body.sessionEventId,
      title: sessionSet.songTitle,
      songId: song.id,
      setOrder: index + 1,
      isPublished: false,
      drumId: sessionSet.drum ?? null,
      bassId: sessionSet.bass ?? null,
      pianoId: sessionSet.piano ?? null,
      keyName: sessionSet.key ?? null,
    };
  });

  const sessionSetMemberRows = sessionSets.flatMap((sessionSet, index) =>
    sessionSet.front.map((participantId) => {
      const participant = participantById.get(participantId);
      if (!participant) {
        throw new Error(`Missing Participant row for ${participantId}`);
      }

      return {
        sessionSetId: sessionSetRows[index].id,
        participantId,
        role: (participant.instrument === 'vocal' ? 'vocal' : 'front') as MemberRole,
      };
    }),
  );

  try {
    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.sessionSetMember.deleteMany({ where: { sessionSet: { sessionEventId: body.sessionEventId } } }),
      prisma.sessionSet.deleteMany({ where: { sessionEventId: body.sessionEventId } }),
    ];

    if (sessionSetRows.length > 0) {
      operations.push(prisma.sessionSet.createMany({ data: sessionSetRows }));
    }

    if (sessionSetMemberRows.length > 0) {
      operations.push(prisma.sessionSetMember.createMany({ data: sessionSetMemberRows }));
    }

    await prisma.$transaction(operations);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({
        error: 'SessionSet generation failed because persisted data is inconsistent',
        code: error.code,
        detail: error.message,
      }, { status: 400 });
    }
    throw error;
  }

  const persistedSessionSets = await prisma.sessionSet.findMany({
    where: { sessionEventId: body.sessionEventId },
    include: {
      song: true,
      drum: true,
      bass: true,
      piano: true,
      members: {
        include: { participant: true },
      },
    },
    orderBy: [{ setOrder: 'asc' }, { title: 'asc' }],
  });
  const data = await serializeSessionSets(persistedSessionSets);

  return NextResponse.json({
    sessionEventId: body.sessionEventId,
    sessionSets: data,
    skippedSongs,
    forcedSessionSets,
  });
}
