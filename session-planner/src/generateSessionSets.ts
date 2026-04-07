import type { Instrument, Participant, SessionGenerationResult, SessionSet, SkippedSong } from './domain';

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

const getMissingRequiredPartReason = (
  candidates: Participant[],
  songTitle: string,
  maxCount: number,
  participationCount: ParticipationCount,
  partLabel: string,
): string | undefined => {
  const requested = candidates.filter(c =>
    c.requestedSongs.some(r => r.title === songTitle),
  );

  if (requested.length === 0) {
    return `${partLabel} の希望者がいません`;
  }

  const available = requested.filter(c => participationCount[c.id] < maxCount);
  if (available.length === 0) {
    return `${partLabel} の候補者が割り当て上限に達しています`;
  }

  return undefined;
};

const chooseRandomForcedParticipant = (
  candidates: Participant[],
  maxCount: number,
  participationCount: ParticipationCount,
): Participant | undefined => {
  const available = candidates.filter((candidate) => participationCount[candidate.id] < maxCount);

  if (available.length === 0) {
    return undefined;
  }

  const minParticipationCount = Math.min(
    ...available.map((candidate) => participationCount[candidate.id] ?? 0),
  );

  const prioritized = available.filter(
    (candidate) => (participationCount[candidate.id] ?? 0) === minParticipationCount,
  );

  const randomIndex = Math.floor(Math.random() * prioritized.length);
  return prioritized[randomIndex];
};

const buildSkippedSong = (
  songTitle: string,
  drum: Participant | undefined,
  bass: Participant | undefined,
  piano: Participant | undefined,
  byInstrument: {
    drum: Participant[];
    bass: Participant[];
    piano: Participant[];
  },
  participationCount: ParticipationCount,
): SkippedSong => ({
  songTitle,
  reasons: [
    !drum ? getMissingRequiredPartReason(byInstrument.drum, songTitle, 4, participationCount, 'Drum') : undefined,
    !bass ? getMissingRequiredPartReason(byInstrument.bass, songTitle, 4, participationCount, 'Bass') : undefined,
    !piano ? getMissingRequiredPartReason(byInstrument.piano, songTitle, 4, participationCount, 'Piano') : undefined,
  ].filter((reason): reason is string => Boolean(reason)),
});

type SkippedCandidate = {
  songTitle: string;
  requesterCount: number;
  reasons: string[];
};

/**
 * front パート用: round=1 を優先しつつ必要人数を選ぶ
 */
const chooseFrontWithPriority = (
  candidates: Participant[],
  songTitle: string,
  participationCount: ParticipationCount,
  min = 0,
  max = 2,
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
export function generateSessionSets(participants: Participant[]): SessionGenerationResult {
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
  const initialSkippedSongs: SkippedCandidate[] = [];
  const forcedSessionSets: SessionGenerationResult['forcedSessionSets'] = [];

  const allByInstrument = {
    drum: participants.filter((participant) => participant.instrument === 'drum'),
    bass: participants.filter((participant) => participant.instrument === 'bass'),
    piano: participants.filter((participant) => participant.instrument === 'piano'),
  } as const;

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

    // Drum, Bass, Piano が揃わない曲は sessionSet を作らない
    if (!drum || !bass || !piano) {
      initialSkippedSongs.push({
        songTitle,
        requesterCount: songParticipants.length,
        reasons: buildSkippedSong(songTitle, drum, bass, piano, byInstrument, participationCount).reasons,
      });
      continue;
    }

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

    const frontMembers = chooseFrontWithPriority(
      byInstrument.front,
      songTitle,
      participationCount,
      0,
      vocal ? 1 : 2,
    );

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

  const remainingSkippedSongs: SessionGenerationResult['skippedSongs'] = [];

  const forceEligibleSongs = [...initialSkippedSongs]
    .filter((song) => song.reasons.length > 0 && song.reasons.every((reason) => reason.includes('希望者がいません')))
    .sort((a, b) => b.requesterCount - a.requesterCount || a.songTitle.localeCompare(b.songTitle));

  const forceIneligibleSongs = initialSkippedSongs.filter(
    (song) => !song.reasons.every((reason) => reason.includes('希望者がいません')),
  );

  for (const skippedSong of forceEligibleSongs) {
    const songTitle = skippedSong.songTitle;
    const songParticipants = participants.filter((participant) =>
      participant.requestedSongs.some((request) => request.title === songTitle),
    );

    const byInstrument = {
      drum: songParticipants.filter((participant) => participant.instrument === 'drum'),
      bass: songParticipants.filter((participant) => participant.instrument === 'bass'),
      piano: songParticipants.filter((participant) => participant.instrument === 'piano'),
      front: songParticipants.filter((participant) => participant.instrument === 'front'),
      vocal: songParticipants.filter((participant) => participant.instrument === 'vocal'),
    } as const;

    const forcedInstruments: Instrument[] = [];

    let drum = chooseOneWithPriority(byInstrument.drum, songTitle, 4, participationCount);
    if (!drum) {
      drum = chooseRandomForcedParticipant(allByInstrument.drum, 4, participationCount);
      if (drum) {
        forcedInstruments.push('drum');
      }
    }

    let bass = chooseOneWithPriority(byInstrument.bass, songTitle, 4, participationCount);
    if (!bass) {
      bass = chooseRandomForcedParticipant(allByInstrument.bass, 4, participationCount);
      if (bass) {
        forcedInstruments.push('bass');
      }
    }

    let piano = chooseOneWithPriority(byInstrument.piano, songTitle, 4, participationCount);
    if (!piano) {
      piano = chooseRandomForcedParticipant(allByInstrument.piano, 4, participationCount);
      if (piano) {
        forcedInstruments.push('piano');
      }
    }

    if (!drum || !bass || !piano) {
      remainingSkippedSongs.push(
        buildSkippedSong(songTitle, drum, bass, piano, byInstrument, participationCount),
      );
      continue;
    }

    const vocalCandidates = byInstrument.vocal.filter((participant) => participationCount[participant.id] < 3);
    let vocal: Participant | undefined;

    if (vocalCandidates.length > 0) {
      const primary = vocalCandidates.filter((participant) =>
        participant.requestedSongs.some((request) => request.title === songTitle && request.round === 1),
      );
      const pool = primary.length > 0 ? primary : vocalCandidates;
      pool.sort((a, b) => participationCount[a.id] - participationCount[b.id]);
      vocal = pool[0];
    }

    const frontMembers = chooseFrontWithPriority(
      byInstrument.front,
      songTitle,
      participationCount,
      0,
      vocal ? 1 : 2,
    );

    const frontIds = [
      ...frontMembers.map((participant) => participant.id),
      ...(vocal ? [vocal.id] : []),
    ];

    let key: string | undefined;
    if (vocal) {
      const request = vocal.requestedSongs.find((song) => song.title === songTitle);
      key = request?.key;
    }

    [drum, bass, piano, ...frontMembers, vocal].forEach((participant) => {
      if (!participant) {
        return;
      }
      participationCount[participant.id] = (participationCount[participant.id] ?? 0) + 1;
    });

    sessionSets.push({
      songTitle,
      drum: drum.id,
      bass: bass.id,
      piano: piano.id,
      front: frontIds,
      key,
    });

    forcedSessionSets.push({
      songTitle,
      forcedInstruments,
      requesterCount: skippedSong.requesterCount,
    });
  }

  return {
    sessionSets,
    skippedSongs: [...forceIneligibleSongs.map((song) => ({ songTitle: song.songTitle, reasons: song.reasons })), ...remainingSkippedSongs],
    forcedSessionSets,
  };
}
