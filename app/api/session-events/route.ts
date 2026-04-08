import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';

export async function GET() {
  const sessionEvents = await prisma.sessionEvent.findMany({
    include: {
      _count: {
        select: {
          sessionEntries: true,
          sessionSets: true,
        },
      },
    },
    orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ sessionEvents });
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const body = (await request.json().catch(() => null)) as
    | {
        title?: string;
        description?: string;
        venue?: string;
        eventDate?: string;
        startTime?: string;
        endTime?: string;
        round1StartAt?: string;
        round1EndAt?: string;
        round2StartAt?: string;
        round2EndAt?: string;
        status?: string;
      }
    | null;

  if (!body?.title || !body.venue || !body.eventDate) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const sessionEvent = await prisma.sessionEvent.create({
    data: {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      venue: body.venue.trim(),
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