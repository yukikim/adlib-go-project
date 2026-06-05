import { normalizeSessionEventStatus, type SessionEventStatus } from './sessionEventStatus';

type SessionEventLike = {
  status: SessionEventStatus | string;
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
    keyName?: string | null;
  }>;
};

export type SessionEventLifecycleState = {
  status: SessionEventStatus;
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

function normalizeDisplayText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeKeyName(value: string | null | undefined) {
  const normalizedValue = value ? normalizeDisplayText(value) : '';
  return normalizedValue || null;
}

export function formatRoundCandidateSong(songTitle: string, keyName?: string | null) {
  const normalizedTitle = normalizeDisplayText(songTitle);
  if (!normalizedTitle) {
    return '';
  }

  const normalizedKey = normalizeKeyName(keyName);
  return normalizedKey ? `${normalizedTitle}(${normalizedKey})` : normalizedTitle;
}

export function getRound1CandidateSongOptions(entries: SessionEventEntryLike[] | undefined) {
  if (!entries?.length) {
    return [] as Array<{ candidateSong: string; songTitle: string; keyName: string | null; requestCount: number }>;
  }

  const candidateSongByKey = new Map<string, { candidateSong: string; songTitle: string; keyName: string | null }>();
  const requestCountByKey = new Map<string, number>();

  for (const entry of entries) {
    if (entry.attendanceStatus === 'absent') {
      continue;
    }

    for (const request of entry.requests ?? []) {
      if (request.round !== 1) {
        continue;
      }

      const songTitle = normalizeDisplayText(request.songTitleSnapshot);
      if (!songTitle) {
        continue;
      }

      const keyName = normalizeKeyName(request.keyName);
      const candidateKey = `${normalizeSongTitle(songTitle)}::${keyName ? normalizeSongTitle(keyName) : ''}`;

      if (!candidateSongByKey.has(candidateKey)) {
        candidateSongByKey.set(candidateKey, {
          candidateSong: formatRoundCandidateSong(songTitle, keyName),
          songTitle,
          keyName,
        });
      }

      requestCountByKey.set(candidateKey, (requestCountByKey.get(candidateKey) ?? 0) + 1);
    }
  }

  return [...candidateSongByKey.entries()]
    .sort((left, right) => {
      const countDelta = (requestCountByKey.get(right[0]) ?? 0) - (requestCountByKey.get(left[0]) ?? 0);
      if (countDelta !== 0) {
        return countDelta;
      }

      return left[1].candidateSong.localeCompare(right[1].candidateSong, 'ja-JP');
    })
    .map(([candidateKey, candidate]) => ({
      ...candidate,
      requestCount: requestCountByKey.get(candidateKey) ?? 0,
    }));
}

function getWindowReason(label: 'round1' | 'round2', start: Date | null, end: Date | null, now: Date) {
  if (start && now < start) {
    return `${label} の募集開始前です`;
  }

  if (end && now > end) {
    return `${label} の募集は終了しました`;
  }

  return `現在は ${label} の募集受付中です`;
}

export function getSessionEventLifecycleState(sessionEvent: SessionEventLike, now = new Date()): SessionEventLifecycleState {
  const status = normalizeSessionEventStatus(sessionEvent.status);
  const round1StartAt = toDate(sessionEvent.round1StartAt);
  const round1EndAt = toDate(sessionEvent.round1EndAt);
  const round2StartAt = toDate(sessionEvent.round2StartAt);
  const round2EndAt = toDate(sessionEvent.round2EndAt);

  switch (status) {
    case 'draft':
      return {
        status,
        canSubmit: false,
        round: null,
        canGenerateSessionSets: false,
        canPrepareRound2Candidates: false,
        reason: '管理者のイベント準備中です',
      };
    case 'announced':
      return {
        status,
        canSubmit: false,
        round: null,
        canGenerateSessionSets: false,
        canPrepareRound2Candidates: false,
        reason: '開催予定イベントとして告知中です',
      };
    case 'recruiting_round1': {
      const canSubmit = isWithinWindow(now, round1StartAt, round1EndAt);
      return {
        status,
        canSubmit,
        round: canSubmit ? 1 : null,
        canGenerateSessionSets: false,
        canPrepareRound2Candidates: Boolean(round1EndAt && now > round1EndAt),
        reason: canSubmit ? null : getWindowReason('round1', round1StartAt, round1EndAt, now),
      };
    }
    case 'recruiting_round2': {
      const canSubmit = isWithinWindow(now, round2StartAt, round2EndAt);
      return {
        status,
        canSubmit,
        round: canSubmit ? 2 : null,
        canGenerateSessionSets: false,
        canPrepareRound2Candidates: true,
        reason: canSubmit ? null : getWindowReason('round2', round2StartAt, round2EndAt, now),
      };
    }
    case 'generating':
      return {
        status,
        canSubmit: false,
        round: null,
        canGenerateSessionSets: true,
        canPrepareRound2Candidates: true,
        reason: 'sessionSet を作成・編集できます',
      };
    case 'published':
      return {
        status,
        canSubmit: false,
        round: null,
        canGenerateSessionSets: false,
        canPrepareRound2Candidates: true,
        reason: 'sessionSet を公開中です',
      };
    case 'rating':
      return {
        status,
        canSubmit: false,
        round: null,
        canGenerateSessionSets: false,
        canPrepareRound2Candidates: true,
        reason: 'レイティング受付中です',
      };
    case 'closed':
      return {
        status,
        canSubmit: false,
        round: null,
        canGenerateSessionSets: false,
        canPrepareRound2Candidates: true,
        reason: 'イベントは終了しました',
      };
  }
}

export function getEffectiveSessionEventStatus(sessionEvent: SessionEventLike, now = new Date()) {
  return getSessionEventLifecycleState(sessionEvent, now).status;
}

export function getRound1CandidateSongs(entries: SessionEventEntryLike[] | undefined) {
  return getRound1CandidateSongOptions(entries).map((candidate) => candidate.candidateSong);
}

export function getSessionEventEntryState(sessionEvent: SessionEventLike, now = new Date()) {
  const lifecycle = getSessionEventLifecycleState(sessionEvent, now);

  return {
    canSubmit: lifecycle.canSubmit,
    round: lifecycle.round,
    reason: lifecycle.canSubmit ? null : lifecycle.reason,
  };
}