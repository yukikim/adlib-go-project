import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { songCreateRequestSchema } from '@/lib/apiSchemas';

// GET /api/songs
export async function GET(request: NextRequest) {
  const catalog = request.nextUrl.searchParams.get('catalog');
  const query = request.nextUrl.searchParams.get('q')?.trim();

  const songs = await prisma.song.findMany({
    where: {
      ...(catalog === 'black-book'
        ? {
            OR: [
              { isJazzStandardBible1: true },
              { isJazzStandardBible2: true },
            ],
          }
        : {}),
      ...(query
        ? {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          }
        : {}),
    },
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
      data: {
        title: body.title,
        isJazzStandardBible1: body.isJazzStandardBible1 ?? false,
        isJazzStandardBible2: body.isJazzStandardBible2 ?? false,
      },
    });
    return NextResponse.json({ song }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create song (maybe duplicate?)' }, { status: 400 });
  }
}
