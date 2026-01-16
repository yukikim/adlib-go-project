import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/requests
// body: { participantId: string; songTitle: string; keyName?: string; round: 1 | 2 }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as
    | { participantId?: string; songTitle?: string; keyName?: string; round?: number }
    | null;

  if (!body || !body.participantId || !body.songTitle || (body.round !== 1 && body.round !== 2)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const participant = await prisma.participant.findUnique({
    where: { id: body.participantId },
    include: {
      requestedSongs: {
        include: { song: true },
      },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
  }

  const round = body.round as 1 | 2;
  const songTitle = body.songTitle.trim();

  // 既存リクエストの集計
  const totalRequests = participant.requestedSongs.length;
  const round1Count = participant.requestedSongs.filter(r => r.round === 1).length;
  const round2Count = participant.requestedSongs.filter(r => r.round === 2).length;

  // instrument ごとのルールチェック
  if (participant.instrument === 'vocal') {
    if (!body.keyName || !body.keyName.trim()) {
      return NextResponse.json({ error: 'keyName is required for vocal' }, { status: 400 });
    }
    if (totalRequests >= 3) {
      return NextResponse.json({ error: 'Vocal can have at most 3 requests' }, { status: 400 });
    }
    if (round === 1 && round1Count >= 2) {
      return NextResponse.json({ error: 'Vocal can have at most 2 round=1 requests' }, { status: 400 });
    }
    if (round === 2 && round2Count >= 1) {
      return NextResponse.json({ error: 'Vocal can have at most 1 round=2 request' }, { status: 400 });
    }
  } else {
    // non-vocal
    if (totalRequests >= 4) {
      return NextResponse.json({ error: 'Non-vocal can have at most 4 requests' }, { status: 400 });
    }
    if (round === 1 && round1Count >= 2) {
      return NextResponse.json({ error: 'Non-vocal can have at most 2 round=1 requests' }, { status: 400 });
    }
    if (round === 2 && round2Count >= 2) {
      return NextResponse.json({ error: 'Non-vocal can have at most 2 round=2 requests' }, { status: 400 });
    }
  }

  // 同じ曲を二重登録しない
  const already = participant.requestedSongs.find(r => r.song.title === songTitle);
  if (already) {
    return NextResponse.json({ error: 'Request for this song already exists' }, { status: 400 });
  }

  // Song の取得/作成
  let song = await prisma.song.findUnique({ where: { title: songTitle } });

  if (!song) {
    if (round === 1) {
      // 1回目の希望では新規曲も許可
      song = await prisma.song.create({ data: { title: songTitle } });
    } else {
      // 2回目の希望では uniqueSongTitles（= round=1で作られた曲）から選ぶ想定なので、存在しなければエラー
      return NextResponse.json({ error: 'Song must be chosen from existing titles for round=2' }, { status: 400 });
    }
  }

  const request = await prisma.participantSongRequest.create({
    data: {
      participantId: participant.id,
      songId: song.id,
      keyName: body.keyName?.trim() || null,
      round,
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}
