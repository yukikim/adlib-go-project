import type { Instrument, Participant, SessionGenerationResult, SessionSet, SkippedSong } from './domain';

const DRUM_MAX_ASSIGNMENTS = 20;
const CORE_PART_MAX_ASSIGNMENTS = 12;
const VOCAL_MAX_ASSIGNMENTS = 4;

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
  const available = candidates.filter(
    (candidate) => candidate.allowForcedAssignment !== false && participationCount[candidate.id] < maxCount,
  );

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

const chooseForcedFrontParticipants = (
  candidates: Participant[],
  participationCount: ParticipationCount,
  existingParticipants: Participant[],
  additionalCount: number,
): Participant[] => {
  const picked: Participant[] = [];

  while (picked.length < additionalCount) {
    const excludedIds = new Set([
      ...existingParticipants.map((participant) => participant.id),
      ...picked.map((participant) => participant.id),
    ]);
    const usedSubInstruments = new Set(
      [...existingParticipants, ...picked]
        .map((participant) => normalizeFrontSubInstrument(participant.subInstrument))
        .filter((value): value is string => Boolean(value)),
    );

    const available = candidates.filter((candidate) =>
      candidate.allowForcedAssignment !== false
      && !excludedIds.has(candidate.id)
      && participationCount[candidate.id] < CORE_PART_MAX_ASSIGNMENTS,
    );

    if (available.length === 0) {
      break;
    }

    const minParticipationCount = Math.min(
      ...available.map((candidate) => participationCount[candidate.id] ?? 0),
    );
    const prioritized = available.filter(
      (candidate) => (participationCount[candidate.id] ?? 0) === minParticipationCount,
    );
    const distinctSubInstrumentCandidates = prioritized.filter((candidate) => {
      const subInstrument = normalizeFrontSubInstrument(candidate.subInstrument);
      return subInstrument && !usedSubInstruments.has(subInstrument);
    });
    const pool = distinctSubInstrumentCandidates.length > 0
      ? distinctSubInstrumentCandidates
      : prioritized;
    const randomIndex = Math.floor(Math.random() * pool.length);

    picked.push(pool[randomIndex]);
  }

  return picked;
};

const getMissingForcedPartReason = (
  candidates: Participant[],
  maxCount: number,
  participationCount: ParticipationCount,
  partLabel: string,
): string => {
  const forceAllowed = candidates.filter((candidate) => candidate.allowForcedAssignment !== false);

  if (forceAllowed.length === 0) {
    return `${partLabel} の強制参加許可者がいません`;
  }

  const available = forceAllowed.filter((candidate) => participationCount[candidate.id] < maxCount);
  if (available.length === 0) {
    return `${partLabel} の強制参加許可者が割り当て上限に達しています`;
  }

  return `${partLabel} の強制参加候補を確保できません`;
};

const getMissingFrontlineReason = (
  frontCandidates: Participant[],
  vocalCandidates: Participant[],
  participationCount: ParticipationCount,
): string => {
  const availableFront = frontCandidates.some(
    (candidate) => participationCount[candidate.id] < CORE_PART_MAX_ASSIGNMENTS,
  );
  const availableVocal = vocalCandidates.some(
    (candidate) => participationCount[candidate.id] < VOCAL_MAX_ASSIGNMENTS,
  );

  if (availableFront || availableVocal) {
    return 'Front/Vocal の候補者を確保できません';
  }

  if (frontCandidates.length === 0 && vocalCandidates.length === 0) {
    return 'Front/Vocal の希望者がいません';
  }

  return 'Front/Vocal の候補者が割り当て上限に達しています';
};

const fillFrontline = (
  songTitle: string,
  frontCandidates: Participant[],
  vocalCandidates: Participant[],
  allFrontCandidates: Participant[],
  participationCount: ParticipationCount,
) => {
  const availableVocalCandidates = vocalCandidates.filter(
    (participant) => participationCount[participant.id] < VOCAL_MAX_ASSIGNMENTS,
  );
  let vocal: Participant | undefined;

  if (availableVocalCandidates.length > 0) {
    const pool = [...availableVocalCandidates].sort(
      (a, b) => participationCount[a.id] - participationCount[b.id],
    );
    vocal = pool[0];
  }

  const requestedFrontMembers = chooseFrontWithPriority(
    frontCandidates,
    songTitle,
    participationCount,
    0,
    vocal ? 1 : 2,
  );
  const targetFrontCount = vocal ? 1 : 2;
  const forcedFrontMembers = chooseForcedFrontParticipants(
    allFrontCandidates,
    participationCount,
    requestedFrontMembers,
    Math.max(targetFrontCount - requestedFrontMembers.length, 0),
  );
  const frontMembers = [...requestedFrontMembers, ...forcedFrontMembers];

  return {
    vocal,
    frontMembers,
    forcedFrontAdded: forcedFrontMembers.length > 0,
  };
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
    !drum ? getMissingRequiredPartReason(byInstrument.drum, songTitle, DRUM_MAX_ASSIGNMENTS, participationCount, 'Drum') : undefined,
    !bass ? getMissingRequiredPartReason(byInstrument.bass, songTitle, CORE_PART_MAX_ASSIGNMENTS, participationCount, 'Bass') : undefined,
    !piano ? getMissingRequiredPartReason(byInstrument.piano, songTitle, CORE_PART_MAX_ASSIGNMENTS, participationCount, 'Piano') : undefined,
  ].filter((reason): reason is string => Boolean(reason)),
});

type SkippedCandidate = {
  songTitle: string;
  requesterCount: number;
  reasons: string[];
};

function normalizeFrontSubInstrument(value: string | undefined) {
  const normalized = value?.trim().toLocaleLowerCase('ja-JP');
  return normalized ? normalized : null;
}

/**
 * front パート用: round=1 を優先しつつ必要人数を選ぶ。
 * 可能な限り subInstrument が重複しない組み合わせを優先する。
 */
const chooseFrontWithPriority = (
  candidates: Participant[],
  songTitle: string,
  participationCount: ParticipationCount,
  min = 0,
  max = 2,
): Participant[] => {
  const picked: Participant[] = [];

  const pickFromRound = (round: 1 | 2) => {
    while (picked.length < max) {
      const alreadyPickedIds = new Set(picked.map((participant) => participant.id));
      const usedSubInstruments = new Set(
        picked
          .map((participant) => normalizeFrontSubInstrument(participant.subInstrument))
          .filter((value): value is string => Boolean(value)),
      );

      const available = candidates.filter((candidate) =>
        !alreadyPickedIds.has(candidate.id)
        && participationCount[candidate.id] < CORE_PART_MAX_ASSIGNMENTS
        && candidate.requestedSongs.some((request) => request.title === songTitle && request.round === round),
      );

      if (available.length === 0) {
        return;
      }

      const distinctSubInstrumentCandidates = available.filter((candidate) => {
        const subInstrument = normalizeFrontSubInstrument(candidate.subInstrument);
        return subInstrument && !usedSubInstruments.has(subInstrument);
      });

      const pool = (distinctSubInstrumentCandidates.length > 0 ? distinctSubInstrumentCandidates : available)
        .sort((left, right) => (participationCount[left.id] ?? 0) - (participationCount[right.id] ?? 0));

      picked.push(pool[0]);
    }
  };

  pickFromRound(1);
  if (picked.length < max) {
    pickFromRound(2);
  }

  if (picked.length === 0) return [];

  const n = Math.min(max, picked.length);
  return picked.slice(0, Math.max(min, n));
};

/**
 * 参加者一覧から sessionSet の配列を生成するメイン関数
 * - 曲リストは「round=1 の希望曲のユニークリスト」
 * - 各曲・各パートで round=1 を優先、足りなければ round=2 から補充
 * - vocal: round=1 で希望した曲のみ参加・最大4曲
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
    front: participants.filter((participant) => participant.instrument === 'front'),
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
      vocal: songParticipants.filter(
        p => p.instrument === 'vocal' && p.requestedSongs.some(r => r.title === songTitle && r.round === 1),
      ),
    } as const;

    const drum = chooseOneWithPriority(byInstrument.drum, songTitle, DRUM_MAX_ASSIGNMENTS, participationCount);
    const bass = chooseOneWithPriority(byInstrument.bass, songTitle, CORE_PART_MAX_ASSIGNMENTS, participationCount);
    const piano = chooseOneWithPriority(byInstrument.piano, songTitle, CORE_PART_MAX_ASSIGNMENTS, participationCount);

    // Drum, Bass, Piano が揃わない曲は sessionSet を作らない
    if (!drum || !bass || !piano) {
      initialSkippedSongs.push({
        songTitle,
        requesterCount: songParticipants.length,
        reasons: buildSkippedSong(songTitle, drum, bass, piano, byInstrument, participationCount).reasons,
      });
      continue;
    }

    const {
      vocal,
      frontMembers,
      forcedFrontAdded,
    } = fillFrontline(
      songTitle,
      byInstrument.front,
      byInstrument.vocal,
      allByInstrument.front,
      participationCount,
    );

    const frontIds = [
      ...frontMembers.map(f => f.id),
      ...(vocal ? [vocal.id] : []),
    ];

    if (frontIds.length === 0) {
      initialSkippedSongs.push({
        songTitle,
        requesterCount: songParticipants.length,
        reasons: [getMissingFrontlineReason(byInstrument.front, byInstrument.vocal, participationCount)],
      });
      continue;
    }

    // key は round=1 の vocal 希望から取得する
    let key: string | undefined;
    if (vocal) {
      const req = vocal.requestedSongs.find(r => r.title === songTitle && r.round === 1);
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

    if (forcedFrontAdded) {
      forcedSessionSets.push({
        songTitle,
        forcedInstruments: ['front'],
        requesterCount: songParticipants.length,
      });
    }
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
      vocal: songParticipants.filter(
        (participant) => participant.instrument === 'vocal'
          && participant.requestedSongs.some((request) => request.title === songTitle && request.round === 1),
      ),
    } as const;

    const forcedInstruments: Instrument[] = [];

    let drum = chooseOneWithPriority(byInstrument.drum, songTitle, DRUM_MAX_ASSIGNMENTS, participationCount);
    if (!drum) {
      drum = chooseRandomForcedParticipant(allByInstrument.drum, DRUM_MAX_ASSIGNMENTS, participationCount);
      if (drum) {
        forcedInstruments.push('drum');
      }
    }

    let bass = chooseOneWithPriority(byInstrument.bass, songTitle, CORE_PART_MAX_ASSIGNMENTS, participationCount);
    if (!bass) {
      bass = chooseRandomForcedParticipant(allByInstrument.bass, CORE_PART_MAX_ASSIGNMENTS, participationCount);
      if (bass) {
        forcedInstruments.push('bass');
      }
    }

    let piano = chooseOneWithPriority(byInstrument.piano, songTitle, CORE_PART_MAX_ASSIGNMENTS, participationCount);
    if (!piano) {
      piano = chooseRandomForcedParticipant(allByInstrument.piano, CORE_PART_MAX_ASSIGNMENTS, participationCount);
      if (piano) {
        forcedInstruments.push('piano');
      }
    }

    if (!drum || !bass || !piano) {
      remainingSkippedSongs.push({
        songTitle,
        reasons: [
          !drum ? getMissingForcedPartReason(allByInstrument.drum, DRUM_MAX_ASSIGNMENTS, participationCount, 'Drum') : undefined,
          !bass ? getMissingForcedPartReason(allByInstrument.bass, CORE_PART_MAX_ASSIGNMENTS, participationCount, 'Bass') : undefined,
          !piano ? getMissingForcedPartReason(allByInstrument.piano, CORE_PART_MAX_ASSIGNMENTS, participationCount, 'Piano') : undefined,
        ].filter((reason): reason is string => Boolean(reason)),
      });
      continue;
    }

    const {
      vocal,
      frontMembers,
      forcedFrontAdded,
    } = fillFrontline(
      songTitle,
      byInstrument.front,
      byInstrument.vocal,
      allByInstrument.front,
      participationCount,
    );

    const frontIds = [
      ...frontMembers.map((participant) => participant.id),
      ...(vocal ? [vocal.id] : []),
    ];

    if (frontIds.length === 0) {
      remainingSkippedSongs.push({
        songTitle,
        reasons: [getMissingFrontlineReason(byInstrument.front, byInstrument.vocal, participationCount)],
      });
      continue;
    }

    let key: string | undefined;
    if (vocal) {
      const request = vocal.requestedSongs.find((song) => song.title === songTitle && song.round === 1);
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
      forcedInstruments: forcedFrontAdded && !forcedInstruments.includes('front')
        ? [...forcedInstruments, 'front']
        : forcedInstruments,
      requesterCount: skippedSong.requesterCount,
    });
  }

  return {
    sessionSets,
    skippedSongs: [...forceIneligibleSongs.map((song) => ({ songTitle: song.songTitle, reasons: song.reasons })), ...remainingSkippedSongs],
    forcedSessionSets,
  };
}
