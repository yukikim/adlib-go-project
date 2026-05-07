import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSessionSets } from '@/session-planner/generateSessionSets';
import type { Participant as DomainParticipant } from '@/session-planner/domain';
import { requireAdmin } from '@/lib/adminApi';
import { getSessionEventLifecycleState } from '@/lib/sessionEventWindow';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { sessionSetGenerateRequestSchema } from '@/lib/apiSchemas';
import { serializeSessionSets } from '@/lib/sessionSets';

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
      `${participant.name}::${participant.instrument}`,
      participant,
    ]),
  );

  const domainParticipants: DomainParticipant[] = sessionEvent.sessionEntries.flatMap((entry) => {
    const participant = participantByKey.get(
      `${entry.memberProfile.displayName}::${entry.memberProfile.mainInstrument}`,
    );

    if (!participant) {
      return [];
    }

    return [
      {
        id: participant.id,
        name: participant.name,
        instrument: participant.instrument as DomainParticipant['instrument'],
        requestedSongs: entry.requests.map((request) => ({
          title: request.songTitleSnapshot,
          key: request.keyName ?? undefined,
          round: request.round === 2 ? 2 : 1,
        })),
      },
    ];
  });

  if (domainParticipants.length === 0) {
    return NextResponse.json({ error: 'No participating members could be mapped to planner participants' }, { status: 400 });
  }

  const { sessionSets, skippedSongs, forcedSessionSets } = generateSessionSets(domainParticipants);

  await prisma.$transaction(async (tx) => {
    await tx.sessionSetMember.deleteMany({ where: { sessionSet: { sessionEventId: body.sessionEventId } } });
    await tx.sessionSet.deleteMany({ where: { sessionEventId: body.sessionEventId } });

    for (const [index, s] of sessionSets.entries()) {
      const song = await tx.song.findUniqueOrThrow({
        where: { title: s.songTitle },
      });

      const created = await tx.sessionSet.create({
        data: {
          sessionEventId: body.sessionEventId,
          title: s.songTitle,
          songId: song.id,
          setOrder: index + 1,
          isPublished: false,
          drumId: s.drum ?? null,
          bassId: s.bass ?? null,
          pianoId: s.piano ?? null,
          keyName: s.key ?? null,
        },
      });

      for (const pid of s.front) {
        const participant = await tx.participant.findUniqueOrThrow({
          where: { id: pid },
        });
        const role = participant.instrument === 'vocal' ? 'vocal' : 'front';

        await tx.sessionSetMember.create({
          data: {
            sessionSetId: created.id,
            participantId: pid,
            role,
          },
        });
      }
    }
  });

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
