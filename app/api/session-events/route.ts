import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { sessionEventCreateRequestSchema } from '@/lib/apiSchemas';
import { getAuthenticatedUser } from '@/lib/auth';
import { getRound1CandidateSongs, getSessionEventLifecycleState } from '@/lib/sessionEventWindow';
import { isSessionEventVisibleToMembers } from '@/lib/sessionEventStatus';

export async function GET(request: NextRequest) {
  const authenticatedUser = await getAuthenticatedUser(request);
  const includeSessionEntries = authenticatedUser?.status === 'active';
  const includeComments = Boolean(authenticatedUser?.status === 'active');

  const sessionEvents = await prisma.sessionEvent.findMany({
    include: {
      _count: {
        select: {
          sessionEntries: true,
          sessionSets: true,
        },
      },
      ...(includeSessionEntries
        ? {
          sessionEntries: {
            include: {
              memberProfile: {
                select: {
                  id: true,
                  displayName: true,
                  mainInstrument: true,
                  subInstrument: true,
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
              keyName: true,
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

  const attendingEntryCountMap = new Map<string, number>();
  for (const sessionEventId of sessionEventIds) {
    attendingEntryCountMap.set(
      sessionEventId,
      candidateSourceEntries.filter((entry) => entry.sessionEventId === sessionEventId && entry.attendanceStatus === 'attending').length,
    );
  }

  const commentRows = !includeComments || sessionEventIds.length === 0
    ? []
    : await prisma.sessionEventComment.findMany({
        where: {
          sessionEventId: { in: sessionEventIds },
        },
        include: {
          userAccount: {
            select: {
              id: true,
              memberProfile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      });

  const commentsByEventId = new Map<string, Array<{
    id: string;
    body: string;
    createdAt: Date;
    memberDisplayName: string;
    userAccountId: string;
  }>>();

  for (const comment of commentRows) {
    const comments = commentsByEventId.get(comment.sessionEventId) ?? [];
    comments.push({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      memberDisplayName: comment.userAccount.memberProfile?.displayName ?? comment.userAccount.id,
      userAccountId: comment.userAccount.id,
    });
    commentsByEventId.set(comment.sessionEventId, comments);
  }

  const ratingSummarySourceSets = sessionEventIds.length === 0
    ? []
    : await prisma.sessionSet.findMany({
        where: {
          sessionEventId: { in: sessionEventIds },
          isPublished: true,
        },
        select: {
          id: true,
          sessionEventId: true,
          title: true,
          setOrder: true,
        },
        orderBy: [{ setOrder: 'asc' }, { title: 'asc' }],
      });
  const ratingRows = sessionEventIds.length === 0
    ? []
    : await prisma.sessionSetRating.findMany({
        where: {
          sessionEventId: { in: sessionEventIds },
        },
        select: {
          id: true,
          sessionEventId: true,
          sessionSetId: true,
          rating: true,
          comment: true,
          sessionSet: {
            select: {
              id: true,
              sessionEventId: true,
              title: true,
              setOrder: true,
            },
          },
        },
        orderBy: [{ ratedAt: 'desc' }],
      });
  const ratingsBySessionSetId = new Map<string, typeof ratingRows>();
  for (const rating of ratingRows) {
    const ratings = ratingsBySessionSetId.get(rating.sessionSetId) ?? [];
    ratings.push(rating);
    ratingsBySessionSetId.set(rating.sessionSetId, ratings);
  }

  const ratingSummaryMap = new Map<string, Array<{
    sessionSetId: string;
    songTitle: string;
    ratingCount: number;
    totalRating: number;
    averageRating: number | null;
    comments: Array<{ id: string; rating: number; comment: string }>;
  }>>();
  for (const sessionEventId of sessionEventIds) {
    ratingSummaryMap.set(
      sessionEventId,
      (() => {
        const summarySourceSetMap = new Map(
          ratingSummarySourceSets
            .filter((sessionSet) => sessionSet.sessionEventId === sessionEventId)
            .map((sessionSet) => [sessionSet.id, sessionSet]),
        );
        for (const rating of ratingRows.filter((item) => item.sessionEventId === sessionEventId)) {
          if (!summarySourceSetMap.has(rating.sessionSetId)) {
            summarySourceSetMap.set(rating.sessionSetId, {
              id: rating.sessionSet.id,
              sessionEventId: rating.sessionEventId,
              title: rating.sessionSet.title,
              setOrder: rating.sessionSet.setOrder,
            });
          }
        }

        return [...summarySourceSetMap.values()]
          .sort((left, right) => {
            const leftOrder = left.setOrder ?? Number.MAX_SAFE_INTEGER;
            const rightOrder = right.setOrder ?? Number.MAX_SAFE_INTEGER;
            if (leftOrder !== rightOrder) {
              return leftOrder - rightOrder;
            }
            return left.title.localeCompare(right.title, 'ja-JP');
          })
          .map((sessionSet) => {
            const ratings = ratingsBySessionSetId.get(sessionSet.id) ?? [];
            const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
            return {
              sessionSetId: sessionSet.id,
              songTitle: sessionSet.title,
              ratingCount: ratings.length,
              totalRating,
              averageRating: ratings.length === 0
                ? null
                : totalRating / ratings.length,
              comments: ratings
                .map((rating) => ({
                  id: rating.id,
                  rating: rating.rating,
                  comment: rating.comment?.trim() ?? '',
                }))
                .filter((rating) => rating.comment.length > 0),
            };
          });
      })(),
    );
  }

  return NextResponse.json({
    sessionEvents: sessionEvents.map((sessionEvent) => ({
      ...sessionEvent,
      ...(() => {
        const lifecycle = getSessionEventLifecycleState(sessionEvent);
        const attendingEntryCount = attendingEntryCountMap.get(sessionEvent.id) ?? 0;
        const remainingEntryCapacity = sessionEvent.participantLimit == null
          ? null
          : Math.max(sessionEvent.participantLimit - attendingEntryCount, 0);
        return {
          status: lifecycle.status,
          canSubmit: lifecycle.canSubmit,
          entryRound: lifecycle.round,
          entryReason: lifecycle.reason,
          canGenerateSessionSets: lifecycle.canGenerateSessionSets,
          canPrepareRound2Candidates: lifecycle.canPrepareRound2Candidates,
          isVisibleToMembers: isSessionEventVisibleToMembers(lifecycle.status),
          attendingEntryCount,
          remainingEntryCapacity,
          isEntryCapacityFull: remainingEntryCapacity === 0,
        };
      })(),
      round2CandidateSongs: candidateSongMap.get(sessionEvent.id) ?? [],
      ratingSummaries: ratingSummaryMap.get(sessionEvent.id) ?? [],
      comments: commentsByEventId.get(sessionEvent.id) ?? [],
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
      participantLimit: body.participantLimit ?? null,
      participationFee: body.participationFee ?? null,
      hasAfterParty: body.hasAfterParty ?? false,
      afterPartyFee: body.hasAfterParty ? (body.afterPartyFee ?? null) : null,
      notes: body.notes ?? null,
      round1StartAt: body.round1StartAt ? new Date(body.round1StartAt) : null,
      round1EndAt: body.round1EndAt ? new Date(body.round1EndAt) : null,
      round2StartAt: body.round2StartAt ? new Date(body.round2StartAt) : null,
      round2EndAt: body.round2EndAt ? new Date(body.round2EndAt) : null,
      status: body.status ?? 'draft',
    },
  });

  return NextResponse.json({ sessionEvent }, { status: 201 });
}
