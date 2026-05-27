import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { sendPublishedSessionSetNotification } from '@/lib/sessionEventNotifications';

export async function POST(request: NextRequest) {
  const { admin, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const sessionEventId = request.nextUrl.pathname.split('/').slice(-2, -1)[0];
  if (!sessionEventId) {
    return NextResponse.json({ error: 'session event id is required' }, { status: 400 });
  }

  const sessionEvent = await prisma.sessionEvent.findUnique({
    where: { id: sessionEventId },
    include: { sessionSets: true },
  });

  if (!sessionEvent) {
    return NextResponse.json({ error: 'SessionEvent not found' }, { status: 404 });
  }

  if (sessionEvent.sessionSets.length === 0) {
    return NextResponse.json({ error: 'No session sets to publish' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const publishedSets = await tx.sessionSet.updateMany({
      where: { sessionEventId },
      data: { isPublished: true },
    });

    const updatedEvent = await tx.sessionEvent.update({
      where: { id: sessionEventId },
      data: { status: 'published' },
      select: { id: true, status: true },
    });

    return { publishedSets, updatedEvent };
  });

  const mailSummary = await sendPublishedSessionSetNotification({
    sessionEventId,
    createdById: admin?.userId,
  });

  return NextResponse.json({
    published: true,
    sessionEventId,
    publishedSetCount: result.publishedSets.count,
    status: result.updatedEvent.status,
    mailSummary,
  });
}