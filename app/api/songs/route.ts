import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/songs
export async function GET() {
  const songs = await prisma.song.findMany({
    orderBy: { title: 'asc' },
  });

  return NextResponse.json({ songs });
}

// POST /api/songs
// body: { title: string }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
  }

  try {
    const song = await prisma.song.create({
      data: { title: body.title.trim() },
    });
    return NextResponse.json({ song }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create song (maybe duplicate?)' }, { status: 400 });
  }
}
