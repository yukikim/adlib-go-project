import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSessionSets } from '@/session-planner/generateSessionSets';
import type { Participant as DomainParticipant } from '@/session-planner/domain';

export async function POST(_req: NextRequest) {
  // 1. DB から参加者 + 希望曲を取得
  const participants = await prisma.participant.findMany({
    include: {
      requestedSongs: {
        include: { song: true },
      },
    },
  });

  // 2. ドメインモデルに変換
  const domainParticipants: DomainParticipant[] = participants.map((p) => ({
    id: p.id,
    name: p.name,
    instrument: p.instrument as DomainParticipant['instrument'],
    requestedSongs: p.requestedSongs.map((rs) => ({
      title: rs.song.title,
      key: rs.keyName ?? undefined,
      round: (rs.round === 2 ? 2 : 1),
    })),
  }));

  // 3. ロジックで sessionSets を生成
  const sessionSets = generateSessionSets(domainParticipants);

  // 4. DB に保存（既存をクリアしてから再生成）
  await prisma.$transaction(async (tx) => {
    await tx.sessionSetMember.deleteMany();
    await tx.sessionSet.deleteMany();

    for (const s of sessionSets) {
      const song = await tx.song.findUniqueOrThrow({
        where: { title: s.songTitle },
      });

      const created = await tx.sessionSet.create({
        data: {
          title: s.songTitle,
          songId: song.id,
          drumId: s.drum ?? null,
          bassId: s.bass ?? null,
          pianoId: s.piano ?? null,
          keyName: s.key ?? null,
        },
      });

      for (const pid of s.front) {
        const participant = await tx.participant.findUniqueOrThrow({
          where: { id: pid },
        });
        const role = participant.instrument === 'vocal' ? 'vocal' : 'front';

        await tx.sessionSetMember.create({
          data: {
            sessionSetId: created.id,
            participantId: pid,
            role,
          },
        });
      }
    }
  });

  return NextResponse.json({ sessionSets });
}
