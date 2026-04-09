import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { sessionEventUpdateRequestSchema } from '@/lib/apiSchemas';

export async function PATCH(request: NextRequest) {
  const { response } = await requireAdmin(request);
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

  const data: Record<string, string | Date | null> = {};
  if (typeof body.title === 'string') data.title = body.title;
  if (typeof body.description === 'string' || body.description === null) data.description = body.description ?? null;
  if (typeof body.venue === 'string') data.venue = body.venue;
  if (typeof body.eventDate === 'string') data.eventDate = new Date(body.eventDate);
  if (typeof body.startTime === 'string' || body.startTime === null) data.startTime = body.startTime ? new Date(body.startTime) : null;
  if (typeof body.endTime === 'string' || body.endTime === null) data.endTime = body.endTime ? new Date(body.endTime) : null;
  if (typeof body.round1StartAt === 'string' || body.round1StartAt === null) data.round1StartAt = body.round1StartAt ? new Date(body.round1StartAt) : null;
  if (typeof body.round1EndAt === 'string' || body.round1EndAt === null) data.round1EndAt = body.round1EndAt ? new Date(body.round1EndAt) : null;
  if (typeof body.round2StartAt === 'string' || body.round2StartAt === null) data.round2StartAt = body.round2StartAt ? new Date(body.round2StartAt) : null;
  if (typeof body.round2EndAt === 'string' || body.round2EndAt === null) data.round2EndAt = body.round2EndAt ? new Date(body.round2EndAt) : null;
  if (typeof body.status === 'string') data.status = body.status;

  const sessionEvent = await prisma.sessionEvent.update({
    where: { id: eventId },
    data,
  });

  return NextResponse.json({ sessionEvent });
}