import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { sessionEventCreateRequestSchema } from '@/lib/apiSchemas';
import { getAuthenticatedUser } from '@/lib/auth';
import { getRound1CandidateSongs, getSessionEventLifecycleState } from '@/lib/sessionEventWindow';

export async function GET(request: NextRequest) {
  const authenticatedUser = await getAuthenticatedUser(request);
  const includeAdminSessionEntries = authenticatedUser?.role === 'admin' && authenticatedUser.status === 'active';

  const sessionEvents = await prisma.sessionEvent.findMany({
    include: {
      _count: {
        select: {
          sessionEntries: true,
          sessionSets: true,
        },
      },
      ...(includeAdminSessionEntries
        ? {
          sessionEntries: {
            include: {
              memberProfile: {
                select: {
                  id: true,
                  displayName: true,
                  mainInstrument: true,
                  nickname: true,
                },
              },
              requests: {
                orderBy: [{ round: 'asc' }, { priority: 'asc' }],
                select: {
                  id: true,
                  songTitleSnapshot: true,
                  round: true,
                  priority: true,
                  keyName: true,
                },
              },
            },
            orderBy: [{ createdAt: 'asc' }],
          },
        }
        : {}),
    },
    orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
  });

  const sessionEventIds = sessionEvents.map((sessionEvent) => sessionEvent.id);
  const candidateSourceEntries = sessionEventIds.length === 0
    ? []
    : await prisma.sessionEntry.findMany({
        where: {
          sessionEventId: { in: sessionEventIds },
        },
        select: {
          sessionEventId: true,
          attendanceStatus: true,
          requests: {
            where: { round: 1 },
            orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
            select: {
              round: true,
              songTitleSnapshot: true,
            },
          },
        },
      });

  const candidateSongMap = new Map<string, string[]>();
  for (const sessionEventId of sessionEventIds) {
    candidateSongMap.set(
      sessionEventId,
      getRound1CandidateSongs(candidateSourceEntries.filter((entry) => entry.sessionEventId === sessionEventId)),
    );
  }

  return NextResponse.json({
    sessionEvents: sessionEvents.map((sessionEvent) => ({
      ...sessionEvent,
      ...(() => {
        const lifecycle = getSessionEventLifecycleState(sessionEvent);
        return {
          status: lifecycle.status,
          canGenerateSessionSets: lifecycle.canGenerateSessionSets,
          canPrepareRound2Candidates: lifecycle.canPrepareRound2Candidates,
        };
      })(),
      round2CandidateSongs: candidateSongMap.get(sessionEvent.id) ?? [],
    })),
  });
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const parsed = sessionEventCreateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const sessionEvent = await prisma.sessionEvent.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      venue: body.venue,
      eventDate: new Date(body.eventDate),
      startTime: body.startTime ? new Date(body.startTime) : null,
      endTime: body.endTime ? new Date(body.endTime) : null,
      round1StartAt: body.round1StartAt ? new Date(body.round1StartAt) : null,
      round1EndAt: body.round1EndAt ? new Date(body.round1EndAt) : null,
      round2StartAt: body.round2StartAt ? new Date(body.round2StartAt) : null,
      round2EndAt: body.round2EndAt ? new Date(body.round2EndAt) : null,
      status: body.status === 'published' ? 'published' : 'draft',
    },
  });

  return NextResponse.json({ sessionEvent }, { status: 201 });
}