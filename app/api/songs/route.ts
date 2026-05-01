import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { songCreateRequestSchema } from '@/lib/apiSchemas';

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
  const { response } = await requireAdmin(req);
  if (response) {
    return response;
  }

  const parsed = songCreateRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const song = await prisma.song.create({
      data: { title: body.title },
    });
    return NextResponse.json({ song }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create song (maybe duplicate?)' }, { status: 400 });
  }
}
