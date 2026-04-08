import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';

// GET /api/participants
export async function GET() {
  const participants = await prisma.participant.findMany({
    include: {
      requestedSongs: {
        include: { song: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ participants });
}

// POST /api/participants
// body: { name: string; instrument: 'drum' | 'bass' | 'piano' | 'front' | 'vocal' }
export async function POST(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) {
    return response;
  }

  const body = await req.json().catch(() => null);

  if (!body || typeof body.name !== 'string' || typeof body.instrument !== 'string') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const allowed = ['drum', 'bass', 'piano', 'front', 'vocal'];
  if (!allowed.includes(body.instrument)) {
    return NextResponse.json({ error: 'Invalid instrument' }, { status: 400 });
  }

  const participant = await prisma.participant.create({
    data: {
      name: body.name,
      instrument: body.instrument,
    },
  });

  return NextResponse.json({ participant }, { status: 201 });
}
