import type { Participant, SessionSet } from './domain';

// 各参加者の「何曲アサインされたか」を管理するマップ
type ParticipationCount = Record<string, number>;

/**
 * round=1 を優先しつつ、最大曲数制限を考慮して 1人選ぶ
 */
const chooseOneWithPriority = (
  candidates: Participant[],
  songTitle: string,
  maxCount: number,
  participationCount: ParticipationCount,
): Participant | undefined => {
  // 1. round=1 でこの曲を希望している人（まだ上限に達していない人）
  const primary = candidates.filter(c =>
    participationCount[c.id] < maxCount &&
    c.requestedSongs.some(r => r.title === songTitle && r.round === 1),
  );

  if (primary.length > 0) {
    primary.sort((a, b) => participationCount[a.id] - participationCount[b.id]);
    return primary[0];
  }

  // 2. 足りなければ round=2 の人も含める
  const secondary = candidates.filter(c =>
    participationCount[c.id] < maxCount &&
    c.requestedSongs.some(r => r.title === songTitle && r.round === 2),
  );

  if (secondary.length === 0) return undefined;

  secondary.sort((a, b) => participationCount[a.id] - participationCount[b.id]);
  return secondary[0];
};

/**
 * front パート用: round=1 を優先しつつ 1〜3人選ぶ
 */
const chooseFrontWithPriority = (
  candidates: Participant[],
  songTitle: string,
  participationCount: ParticipationCount,
  min = 1,
  max = 3,
): Participant[] => {
  const pick = (round: 1 | 2, alreadyPickedIds = new Set<string>()) => {
    const filtered = candidates.filter(c =>
      !alreadyPickedIds.has(c.id) &&
      participationCount[c.id] < 4 &&
      c.requestedSongs.some(r => r.title === songTitle && r.round === round),
    );
    filtered.sort((a, b) => participationCount[a.id] - participationCount[b.id]);
    return filtered;
  };

  const picked: Participant[] = [];

  // 1. round=1 から取る
  picked.push(...pick(1));
  if (picked.length >= max) return picked.slice(0, max);

  // 2. 足りなければ round=2 から補う
  const already = new Set(picked.map(p => p.id));
  picked.push(...pick(2, already));

  if (picked.length === 0) return [];

  const n = Math.min(max, picked.length);
  return picked.slice(0, Math.max(min, n));
};

/**
 * 参加者一覧から sessionSet の配列を生成するメイン関数
 * - 曲リストは「round=1 の希望曲のユニークリスト」
 * - 各曲・各パートで round=1 を優先、足りなければ round=2 から補充
 * - vocal: 希望曲のみ参加・最大3曲、round=1 を優先
 */
export function generateSessionSets(participants: Participant[]): SessionSet[] {
  const participationCount: ParticipationCount = {};
  participants.forEach(p => {
    participationCount[p.id] = 0;
  });

  // round=1 の希望からユニークな曲名リストを作成
  const uniqueSongTitles = Array.from(
    new Set(
      participants
        .flatMap(p => p.requestedSongs.filter(r => r.round === 1))
        .map(r => r.title),
    ),
  );

  const sessionSets: SessionSet[] = [];

  for (const songTitle of uniqueSongTitles) {
    // この曲を少なくともどこかの round で希望している参加者
    const songParticipants = participants.filter(p =>
      p.requestedSongs.some(r => r.title === songTitle),
    );

    const byInstrument = {
      drum: songParticipants.filter(p => p.instrument === 'drum'),
      bass: songParticipants.filter(p => p.instrument === 'bass'),
      piano: songParticipants.filter(p => p.instrument === 'piano'),
      front: songParticipants.filter(p => p.instrument === 'front'),
      vocal: songParticipants.filter(p => p.instrument === 'vocal'),
    } as const;

    const drum = chooseOneWithPriority(byInstrument.drum, songTitle, 4, participationCount);
    const bass = chooseOneWithPriority(byInstrument.bass, songTitle, 4, participationCount);
    const piano = chooseOneWithPriority(byInstrument.piano, songTitle, 4, participationCount);
    const frontMembers = chooseFrontWithPriority(
      byInstrument.front,
      songTitle,
      participationCount,
    );

    // vocal: 希望曲のみ参加 (最大3曲) + round=1 を優先
    const vocalCandidates = byInstrument.vocal.filter(v => participationCount[v.id] < 3);
    let vocal: Participant | undefined;

    if (vocalCandidates.length > 0) {
      const primary = vocalCandidates.filter(v =>
        v.requestedSongs.some(r => r.title === songTitle && r.round === 1),
      );
      const pool = primary.length > 0 ? primary : vocalCandidates;
      pool.sort((a, b) => participationCount[a.id] - participationCount[b.id]);
      vocal = pool[0];
    }

    const frontIds = [
      ...frontMembers.map(f => f.id),
      ...(vocal ? [vocal.id] : []),
    ];

    // key は「この曲を vocal が希望したレコード」から取得（round は問わない）
    let key: string | undefined;
    if (vocal) {
      const req = vocal.requestedSongs.find(r => r.title === songTitle);
      key = req?.key;
    }

    // 参加曲数カウンタ更新
    [drum, bass, piano, ...frontMembers, vocal].forEach(p => {
      if (!p) return;
      participationCount[p.id] = (participationCount[p.id] ?? 0) + 1;
    });

    sessionSets.push({
      songTitle,
      drum: drum?.id,
      bass: bass?.id,
      piano: piano?.id,
      front: frontIds,
      key,
    });
  }

  return sessionSets;
}
