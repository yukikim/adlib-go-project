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

  const segments = request.nextUrl.pathname.split('/');
  const sessionSetId = segments[segments.length - 3];
  if (!sessionSetId) {
    return NextResponse.json({ error: 'session set id is required' }, { status: 400 });
  }

  const sessionSet = await prisma.sessionSet.findUnique({
    where: { id: sessionSetId },
    include: { ratings: true },
  });

  if (!sessionSet) {
    return NextResponse.json({ error: 'session set not found' }, { status: 404 });
  }

  const values = sessionSet.ratings.map((rating) => rating.rating);
  const ratingCount = values.length;
  const totalRating = values.reduce((sum, value) => sum + value, 0);

  return NextResponse.json({
    summary: {
      sessionSetId,
      ratingCount,
      totalRating,
      averageRating: ratingCount === 0 ? null : totalRating / ratingCount,
      minRating: ratingCount === 0 ? null : Math.min(...values),
      maxRating: ratingCount === 0 ? null : Math.max(...values),
      distribution: distribution(values),
      ratedMemberCount: new Set(sessionSet.ratings.map((rating) => rating.userAccountId)).size,
    },
  });
}
