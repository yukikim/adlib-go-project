import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';

function distribution(values: number[]) {
  const base: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  for (const value of values) {
    base[String(value)] += 1;
  }
  return base;
}

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const sessionEventId = request.nextUrl.pathname.split('/').slice(-2, -1)[0];
  if (!sessionEventId) {
    return NextResponse.json({ error: 'session event id is required' }, { status: 400 });
  }

  const sessionSets = await prisma.sessionSet.findMany({
    where: { sessionEventId },
    select: {
      id: true,
      title: true,
      setOrder: true,
    },
    orderBy: [{ setOrder: 'asc' }, { title: 'asc' }],
  });
  const ratings = await prisma.sessionSetRating.findMany({
    where: { sessionEventId },
    select: {
      id: true,
      sessionSetId: true,
      userAccountId: true,
      rating: true,
      comment: true,
      sessionSet: {
        select: {
          id: true,
          title: true,
          setOrder: true,
        },
      },
    },
    orderBy: [{ ratedAt: 'desc' }],
  });
  const ratingsBySessionSetId = new Map<string, typeof ratings>();
  for (const rating of ratings) {
    const currentRatings = ratingsBySessionSetId.get(rating.sessionSetId) ?? [];
    currentRatings.push(rating);
    ratingsBySessionSetId.set(rating.sessionSetId, currentRatings);
  }
  const summarySourceSetMap = new Map(
    sessionSets.map((sessionSet) => [sessionSet.id, sessionSet]),
  );
  for (const rating of ratings) {
    if (!summarySourceSetMap.has(rating.sessionSetId)) {
      summarySourceSetMap.set(rating.sessionSetId, rating.sessionSet);
    }
  }
  const summarySourceSets = [...summarySourceSetMap.values()].sort((left, right) => {
    const leftOrder = left.setOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.setOrder ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.title.localeCompare(right.title, 'ja-JP');
  });

  const summaries = summarySourceSets.map((sessionSet) => {
    const sessionSetRatings = ratingsBySessionSetId.get(sessionSet.id) ?? [];
    const values = sessionSetRatings.map((rating) => rating.rating);
    const ratingCount = values.length;
    return {
      sessionSetId: sessionSet.id,
      songTitle: sessionSet.title,
      ratingCount,
      averageRating: ratingCount === 0 ? null : values.reduce((sum, value) => sum + value, 0) / ratingCount,
      minRating: ratingCount === 0 ? null : Math.min(...values),
      maxRating: ratingCount === 0 ? null : Math.max(...values),
      distribution: distribution(values),
      ratedMemberCount: new Set(sessionSetRatings.map((rating) => rating.userAccountId)).size,
      comments: sessionSetRatings
        .map((rating) => ({
          id: rating.id,
          rating: rating.rating,
          comment: rating.comment?.trim() ?? '',
        }))
        .filter((rating) => rating.comment.length > 0),
    };
  });

  return NextResponse.json({ sessionEventId, summaries });
}
