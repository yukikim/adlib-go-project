type SessionEventLike = {
  status: string;
  round1StartAt: Date | string | null;
  round1EndAt: Date | string | null;
  round2StartAt: Date | string | null;
  round2EndAt: Date | string | null;
};

type SessionEventEntryLike = {
  attendanceStatus?: string | null;
  requests?: Array<{
    round: number;
    songTitleSnapshot: string;
  }>;
};

export type SessionEventLifecycleState = {
  status: string;
  canSubmit: boolean;
  round: 1 | 2 | null;
  canGenerateSessionSets: boolean;
  canPrepareRound2Candidates: boolean;
  reason: string | null;
};

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function isWithinWindow(now: Date, start: Date | null, end: Date | null) {
  if (start && now < start) {
    return false;
  }

  if (end && now > end) {
    return false;
  }

  return true;
}

function normalizeSongTitle(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ja-JP');
}

export function getSessionEventLifecycleState(sessionEvent: SessionEventLike, now = new Date()): SessionEventLifecycleState {
  if (sessionEvent.status === 'published' || sessionEvent.status === 'closed') {
    return {
      status: sessionEvent.status,
      canSubmit: false,
      round: null,
      canGenerateSessionSets: false,
      canPrepareRound2Candidates: false,
      reason: '現在は募集受付中ではありません',
    };
  }

  const round1StartAt = toDate(sessionEvent.round1StartAt);
  const round1EndAt = toDate(sessionEvent.round1EndAt);
  const round2StartAt = toDate(sessionEvent.round2StartAt);
  const round2EndAt = toDate(sessionEvent.round2EndAt);
  const hasRound1Window = Boolean(round1StartAt || round1EndAt);
  const hasRound2Window = Boolean(round2StartAt || round2EndAt);

  if (hasRound2Window && isWithinWindow(now, round2StartAt, round2EndAt)) {
    return {
      status: 'recruiting_round2',
      canSubmit: true,
      round: 2,
      canGenerateSessionSets: false,
      canPrepareRound2Candidates: true,
      reason: null,
    };
  }

  if (hasRound1Window && isWithinWindow(now, round1StartAt, round1EndAt)) {
    return {
      status: 'recruiting_round1',
      canSubmit: true,
      round: 1,
      canGenerateSessionSets: false,
      canPrepareRound2Candidates: false,
      reason: null,
    };
  }

  if (round2EndAt && now > round2EndAt) {
    return {
      status: 'generating',
      canSubmit: false,
      round: null,
      canGenerateSessionSets: true,
      canPrepareRound2Candidates: true,
      reason: 'round2 は終了しています',
    };
  }

  if (hasRound2Window && round2StartAt && now < round2StartAt && round1EndAt && now > round1EndAt) {
    return {
      status: 'generating',
      canSubmit: false,
      round: null,
      canGenerateSessionSets: false,
      canPrepareRound2Candidates: true,
      reason: 'round2 の募集開始前です',
    };
  }

  if (!hasRound2Window && round1EndAt && now > round1EndAt) {
    return {
      status: 'generating',
      canSubmit: false,
      round: null,
      canGenerateSessionSets: true,
      canPrepareRound2Candidates: true,
      reason: 'round1 は終了しています',
    };
  }

  if (!round1StartAt && !round1EndAt && sessionEvent.status === 'generating') {
    return {
      status: 'generating',
      canSubmit: false,
      round: null,
      canGenerateSessionSets: true,
      canPrepareRound2Candidates: true,
      reason: '生成可能です',
    };
  }

  if (round1StartAt && now < round1StartAt) {
    return {
      status: 'draft',
      canSubmit: false,
      round: null,
      canGenerateSessionSets: false,
      canPrepareRound2Candidates: false,
      reason: 'round1 の募集開始前です',
    };
  }

  return {
    status: sessionEvent.status,
    canSubmit: false,
    round: null,
    canGenerateSessionSets: sessionEvent.status === 'generating',
    canPrepareRound2Candidates: Boolean(round1EndAt && now > round1EndAt),
    reason: '現在は募集受付中ではありません',
  };
}

export function getEffectiveSessionEventStatus(sessionEvent: SessionEventLike, now = new Date()) {
  return getSessionEventLifecycleState(sessionEvent, now).status;
}

export function getRound1CandidateSongs(entries: SessionEventEntryLike[] | undefined) {
  if (!entries?.length) {
    return [] as string[];
  }

  const songTitleByKey = new Map<string, string>();
  const requestCountByKey = new Map<string, number>();

  for (const entry of entries) {
    if (entry.attendanceStatus === 'absent') {
      continue;
    }

    for (const request of entry.requests ?? []) {
      if (request.round !== 1) {
        continue;
      }

      const normalizedTitle = normalizeSongTitle(request.songTitleSnapshot);
      if (!normalizedTitle) {
        continue;
      }

      if (!songTitleByKey.has(normalizedTitle)) {
        songTitleByKey.set(normalizedTitle, request.songTitleSnapshot.trim().replace(/\s+/g, ' '));
      }
      requestCountByKey.set(normalizedTitle, (requestCountByKey.get(normalizedTitle) ?? 0) + 1);
    }
  }

  return [...songTitleByKey.entries()]
    .sort((left, right) => {
      const countDelta = (requestCountByKey.get(right[0]) ?? 0) - (requestCountByKey.get(left[0]) ?? 0);
      if (countDelta !== 0) {
        return countDelta;
      }

      return left[1].localeCompare(right[1], 'ja-JP');
    })
    .map(([, title]) => title);
}

export function getSessionEventEntryState(sessionEvent: SessionEventLike, now = new Date()) {
  const lifecycle = getSessionEventLifecycleState(sessionEvent, now);

  return {
    canSubmit: lifecycle.canSubmit,
    round: lifecycle.round,
    reason: lifecycle.canSubmit ? null : lifecycle.reason,
  };
}