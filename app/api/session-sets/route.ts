import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, type MemberRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { serializeSessionSets } from '@/lib/sessionSets';

const editableSessionSetMemberSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1, 'Invalid member name'),
  subInstrument: z.union([z.string(), z.null()]).optional(),
  isForced: z.boolean().optional(),
  forcedCount: z.number().int().min(0).optional(),
}).strict();

const editableSessionSetSchema = z.object({
  id: z.string().trim().min(1).optional(),
  sessionEventId: z.string().trim().min(1).optional(),
  songTitle: z.string().trim().min(1, 'Invalid song title'),
  key: z.union([z.string(), z.null()]).optional(),
  setOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
  drum: z.union([editableSessionSetMemberSchema, z.null()]).optional(),
  bass: z.union([editableSessionSetMemberSchema, z.null()]).optional(),
  piano: z.union([editableSessionSetMemberSchema, z.null()]).optional(),
  front: z.array(editableSessionSetMemberSchema).max(2).optional().default([]),
  vocal: z.array(editableSessionSetMemberSchema).max(1).optional().default([]),
}).strict();

const updateSessionSetsRequestSchema = z.object({
  sessionEventId: z.string().trim().min(1, 'sessionEventId is required'),
  sessionSets: z.array(editableSessionSetSchema).min(1, 'sessionSets is required'),
}).strict();

function buildParticipantKey(name: string, instrument: string) {
  return `${name}::${instrument}`;
}

// GET /api/session-sets
export async function GET(request: NextRequest) {
  const sessionEventId = request.nextUrl.searchParams.get('sessionEventId');

  const sessionSets = await prisma.sessionSet.findMany({
    where: sessionEventId ? { sessionEventId } : undefined,
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

  const data = await serializeSessionSets(sessionSets);

  return NextResponse.json({ sessionSets: data, sessionEventId });
}

export async function PATCH(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const parsed = updateSessionSetsRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }

  const body = parsed.data;
  const sessionEvent = await prisma.sessionEvent.findUnique({
    where: { id: body.sessionEventId },
    select: {
      id: true,
      sessionSets: {
        select: { isPublished: true },
      },
    },
  });

  if (!sessionEvent) {
    return NextResponse.json({ error: 'SessionEvent not found' }, { status: 404 });
  }

  const songs = await prisma.song.findMany({
    where: {
      title: { in: [...new Set(body.sessionSets.map((sessionSet) => sessionSet.songTitle))] },
    },
    select: { id: true, title: true },
  });
  const songByTitle = new Map(songs.map((song) => [song.title, song]));
  const missingSongs = [...new Set(body.sessionSets.map((sessionSet) => sessionSet.songTitle))]
    .filter((songTitle) => !songByTitle.has(songTitle));

  if (missingSongs.length > 0) {
    return NextResponse.json({
      error: 'Some edited sessionSets reference songs that do not exist in Song table',
      missingSongs,
    }, { status: 400 });
  }

  const participants = await prisma.participant.findMany({
    select: { id: true, name: true, instrument: true },
  });
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const participantByKey = new Map(participants.map((participant) => [buildParticipantKey(participant.name, participant.instrument), participant]));

  const resolveParticipant = (
    member: z.infer<typeof editableSessionSetMemberSchema> | null | undefined,
    instrument: 'drum' | 'bass' | 'piano' | 'front' | 'vocal',
  ) => {
    if (!member) {
      return null;
    }

    const participantByExactId = member.id ? participantById.get(member.id) : undefined;
    if (participantByExactId?.instrument === instrument) {
      return participantByExactId;
    }

    return participantByKey.get(buildParticipantKey(member.name, instrument)) ?? null;
  };

  const missingParticipants: Array<{ songTitle: string; instrument: string; name: string }> = [];
  const normalizedSessionSets = body.sessionSets.map((sessionSet, index) => {
    const drum = resolveParticipant(sessionSet.drum, 'drum');
    const bass = resolveParticipant(sessionSet.bass, 'bass');
    const piano = resolveParticipant(sessionSet.piano, 'piano');
    const front = sessionSet.front.map((member) => ({ source: member, participant: resolveParticipant(member, 'front') }));
    const vocal = sessionSet.vocal.map((member) => ({ source: member, participant: resolveParticipant(member, 'vocal') }));

    if (sessionSet.drum && !drum) {
      missingParticipants.push({ songTitle: sessionSet.songTitle, instrument: 'drum', name: sessionSet.drum.name });
    }
    if (sessionSet.bass && !bass) {
      missingParticipants.push({ songTitle: sessionSet.songTitle, instrument: 'bass', name: sessionSet.bass.name });
    }
    if (sessionSet.piano && !piano) {
      missingParticipants.push({ songTitle: sessionSet.songTitle, instrument: 'piano', name: sessionSet.piano.name });
    }
    for (const member of front) {
      if (!member.participant) {
        missingParticipants.push({ songTitle: sessionSet.songTitle, instrument: 'front', name: member.source.name });
      }
    }
    for (const member of vocal) {
      if (!member.participant) {
        missingParticipants.push({ songTitle: sessionSet.songTitle, instrument: 'vocal', name: member.source.name });
      }
    }

    return {
      index,
      sessionSet,
      drum,
      bass,
      piano,
      front,
      vocal,
    };
  });

  if (missingParticipants.length > 0) {
    return NextResponse.json({
      error: 'Some edited members could not be mapped to Participant rows',
      missingParticipants,
    }, { status: 400 });
  }

  const duplicateAssignments = normalizedSessionSets.flatMap(({ sessionSet, front, vocal }) => {
    const assignedKeys = [
      ...front.map((member) => member.participant?.id).filter((value): value is string => Boolean(value)),
      ...vocal.map((member) => member.participant?.id).filter((value): value is string => Boolean(value)),
    ];
    const seen = new Set<string>();
    return assignedKeys.filter((participantId) => {
      if (seen.has(participantId)) {
        return true;
      }
      seen.add(participantId);
      return false;
    }).map((participantId) => ({ songTitle: sessionSet.songTitle, participantId }));
  });

  if (duplicateAssignments.length > 0) {
    return NextResponse.json({
      error: 'A sessionSet contains duplicate front/vocal assignments',
      duplicateAssignments,
    }, { status: 400 });
  }

  const keepPublished = sessionEvent.sessionSets.some((sessionSet) => sessionSet.isPublished);
  const sessionSetRows = normalizedSessionSets.map(({ sessionSet, drum, bass, piano }, index) => ({
    id: randomUUID(),
    sessionEventId: body.sessionEventId,
    title: sessionSet.songTitle,
    songId: songByTitle.get(sessionSet.songTitle)?.id,
    setOrder: sessionSet.setOrder ?? index + 1,
    isPublished: keepPublished,
    drumId: drum?.id ?? null,
    bassId: bass?.id ?? null,
    pianoId: piano?.id ?? null,
    keyName: sessionSet.key ?? null,
  }));

  const sessionSetMemberRows = normalizedSessionSets.flatMap(({ front, vocal }, index) => {
    const frontRows = front.flatMap((member) => member.participant ? [{
      sessionSetId: sessionSetRows[index].id,
      participantId: member.participant.id,
      role: 'front' as MemberRole,
    }] : []);
    const vocalRows = vocal.flatMap((member) => member.participant ? [{
      sessionSetId: sessionSetRows[index].id,
      participantId: member.participant.id,
      role: 'vocal' as MemberRole,
    }] : []);
    return [...frontRows, ...vocalRows];
  });

  try {
    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.sessionSetMember.deleteMany({ where: { sessionSet: { sessionEventId: body.sessionEventId } } }),
      prisma.sessionSet.deleteMany({ where: { sessionEventId: body.sessionEventId } }),
      prisma.sessionSet.createMany({
        data: sessionSetRows.map((row) => ({
          ...row,
          songId: row.songId!,
        })),
      }),
    ];

    if (sessionSetMemberRows.length > 0) {
      operations.push(prisma.sessionSetMember.createMany({ data: sessionSetMemberRows }));
    }

    await prisma.$transaction(operations);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({
        error: 'Edited sessionSets could not be saved',
        code: error.code,
        detail: error.message,
      }, { status: 400 });
    }

    throw error;
  }

  const sessionSets = await prisma.sessionSet.findMany({
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
  const data = await serializeSessionSets(sessionSets);

  return NextResponse.json({ sessionSets: data, sessionEventId: body.sessionEventId });
}
