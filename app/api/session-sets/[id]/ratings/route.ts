import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMemberUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await requireMemberUser(request);
  if ('response' in auth) {
    return auth.response;
  }

  const sessionSetId = request.nextUrl.pathname.split('/').slice(-2, -1)[0];
  if (!sessionSetId) {
    return NextResponse.json({ error: 'session set id is required' }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { rating?: number; comment?: string | null } | null;
  const rating = body?.rating;

  if (!Number.isInteger(rating) || rating! < 1 || rating! > 5) {
    return NextResponse.json({ error: 'rating must be an integer between 1 and 5' }, { status: 400 });
  }

  const normalizedRating = rating as number;

  const sessionSet = await prisma.sessionSet.findUnique({
    where: { id: sessionSetId },
    include: { sessionEvent: true },
  });

  if (!sessionSet || !sessionSet.sessionEventId) {
    return NextResponse.json({ error: 'session set not found' }, { status: 404 });
  }

  if (!sessionSet.isPublished || !sessionSet.sessionEvent || !['published', 'closed'].includes(sessionSet.sessionEvent.status)) {
    return NextResponse.json({ error: 'session set is not open for rating' }, { status: 400 });
  }

  const saved = await prisma.sessionSetRating.upsert({
    where: {
      sessionSetId_userAccountId: {
        sessionSetId,
        userAccountId: auth.user.id,
      },
    },
    update: {
      rating: normalizedRating,
      comment: body?.comment?.trim() || null,
      sessionEventId: sessionSet.sessionEventId,
    },
    create: {
      sessionEventId: sessionSet.sessionEventId,
      sessionSetId,
      userAccountId: auth.user.id,
      rating: normalizedRating,
      comment: body?.comment?.trim() || null,
    },
  });

  return NextResponse.json({ rating: saved }, { status: 201 });
}