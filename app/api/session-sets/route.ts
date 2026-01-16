import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/session-sets
export async function GET() {
  const sessionSets = await prisma.sessionSet.findMany({
    include: {
      song: true,
      drum: true,
      bass: true,
      piano: true,
      members: {
        include: { participant: true },
      },
    },
    orderBy: { title: 'asc' },
  });

  // レスポンスを少しフラットな形に整形
  const data = sessionSets.map((s) => ({
    id: s.id,
    songTitle: s.song.title,
    key: s.keyName,
    drum: s.drum ? { id: s.drum.id, name: s.drum.name } : null,
    bass: s.bass ? { id: s.bass.id, name: s.bass.name } : null,
    piano: s.piano ? { id: s.piano.id, name: s.piano.name } : null,
    front: s.members
      .filter((m) => m.role === 'front')
      .map((m) => ({ id: m.participant.id, name: m.participant.name })),
    vocal: s.members
      .filter((m) => m.role === 'vocal')
      .map((m) => ({ id: m.participant.id, name: m.participant.name })),
  }));

  return NextResponse.json({ sessionSets: data });
}
