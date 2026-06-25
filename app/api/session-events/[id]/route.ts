import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { sessionEventUpdateRequestSchema } from '@/lib/apiSchemas';
import { sendSessionEventStatusNotification } from '@/lib/sessionEventNotifications';
import { createSessionArchive } from '@/lib/sessionArchive';

export async function PATCH(request: NextRequest) {
  const { admin, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const eventId = request.nextUrl.pathname.split('/').pop();
  if (!eventId) {
    return NextResponse.json({ error: 'event id is required' }, { status: 400 });
  }

  const parsed = sessionEventUpdateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const currentSessionEvent = await prisma.sessionEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      venue: true,
      eventDate: true,
      status: true,
    },
  });

  if (!currentSessionEvent) {
    return NextResponse.json({ error: 'SessionEvent not found' }, { status: 404 });
  }

  const data: Record<string, string | number | boolean | Date | null> = {};
  if (typeof body.title === 'string') data.title = body.title;
  if (typeof body.description === 'string' || body.description === null) data.description = body.description ?? null;
  if (typeof body.venue === 'string') data.venue = body.venue;
  if (typeof body.eventDate === 'string') data.eventDate = new Date(body.eventDate);
  if (typeof body.startTime === 'string' || body.startTime === null) data.startTime = body.startTime ? new Date(body.startTime) : null;
  if (typeof body.endTime === 'string' || body.endTime === null) data.endTime = body.endTime ? new Date(body.endTime) : null;
  if (typeof body.participantLimit === 'number' || body.participantLimit === null) data.participantLimit = body.participantLimit ?? null;
  if (typeof body.participationFee === 'number' || body.participationFee === null) data.participationFee = body.participationFee ?? null;
  if (typeof body.hasAfterParty === 'boolean') data.hasAfterParty = body.hasAfterParty;
  if (typeof body.afterPartyFee === 'number' || body.afterPartyFee === null) data.afterPartyFee = body.afterPartyFee ?? null;
  if (typeof body.notes === 'string' || body.notes === null) data.notes = body.notes ?? null;
  if (typeof body.round1StartAt === 'string' || body.round1StartAt === null) data.round1StartAt = body.round1StartAt ? new Date(body.round1StartAt) : null;
  if (typeof body.round1EndAt === 'string' || body.round1EndAt === null) data.round1EndAt = body.round1EndAt ? new Date(body.round1EndAt) : null;
  if (typeof body.round2StartAt === 'string' || body.round2StartAt === null) data.round2StartAt = body.round2StartAt ? new Date(body.round2StartAt) : null;
  if (typeof body.round2EndAt === 'string' || body.round2EndAt === null) data.round2EndAt = body.round2EndAt ? new Date(body.round2EndAt) : null;
  if (typeof body.status === 'string') data.status = body.status;

  const sessionEvent = await prisma.sessionEvent.update({
    where: { id: eventId },
    data,
  });

  let mailSummary = undefined;
  if (body.status && body.status !== currentSessionEvent.status) {
    mailSummary = await sendSessionEventStatusNotification({
      sessionEventId: sessionEvent.id,
      previousStatus: currentSessionEvent.status,
      nextStatus: body.status,
      createdById: admin?.userId,
    });
  }

  let archiveSummary = undefined;
  if (body.status === 'closed' && currentSessionEvent.status !== 'closed' && admin?.userId) {
    const existingArchive = await prisma.sessionArchive.findFirst({
      where: {
        sessionEventId: sessionEvent.id,
        deletedAt: null,
      },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
      },
    });

    if (existingArchive) {
      archiveSummary = {
        status: 'already_exists',
        archiveId: existingArchive.id,
        version: existingArchive.version,
      };
    } else {
      try {
        const archive = await createSessionArchive({
          sessionEventId: sessionEvent.id,
          title: `${sessionEvent.title} アーカイブ`,
          note: 'イベント終了時に自動作成',
          createdById: admin.userId,
        });
        archiveSummary = {
          status: 'created',
          archiveId: archive.id,
          version: archive.version,
        };
      } catch (error) {
        archiveSummary = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Failed to create archive',
        };
      }
    }
  }

  return NextResponse.json({ sessionEvent, mailSummary, archiveSummary });
}
