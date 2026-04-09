import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { participantCreateRequestSchema } from '@/lib/apiSchemas';

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

  const parsed = participantCreateRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const participant = await prisma.participant.create({
    data: {
      name: body.name,
      instrument: body.instrument,
    },
  });

  return NextResponse.json({ participant }, { status: 201 });
}
