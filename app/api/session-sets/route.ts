import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeSessionSets } from '@/lib/sessionSets';

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
