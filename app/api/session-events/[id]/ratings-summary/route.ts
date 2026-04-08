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
    include: {
      ratings: true,
    },
    orderBy: [{ setOrder: 'asc' }, { title: 'asc' }],
  });

  const summaries = sessionSets.map((sessionSet) => {
    const values = sessionSet.ratings.map((rating) => rating.rating);
    const ratingCount = values.length;
    return {
      sessionSetId: sessionSet.id,
      songTitle: sessionSet.title,
      ratingCount,
      averageRating: ratingCount === 0 ? null : values.reduce((sum, value) => sum + value, 0) / ratingCount,
      minRating: ratingCount === 0 ? null : Math.min(...values),
      maxRating: ratingCount === 0 ? null : Math.max(...values),
      distribution: distribution(values),
      ratedMemberCount: new Set(sessionSet.ratings.map((rating) => rating.userAccountId)).size,
    };
  });

  return NextResponse.json({ sessionEventId, summaries });
}