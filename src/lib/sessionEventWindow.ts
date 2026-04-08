type SessionEventLike = {
  status: string;
  round1StartAt: Date | string | null;
  round1EndAt: Date | string | null;
  round2StartAt: Date | string | null;
  round2EndAt: Date | string | null;
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

export function getSessionEventEntryState(sessionEvent: SessionEventLike, now = new Date()) {
  const round1StartAt = toDate(sessionEvent.round1StartAt);
  const round1EndAt = toDate(sessionEvent.round1EndAt);
  const round2StartAt = toDate(sessionEvent.round2StartAt);
  const round2EndAt = toDate(sessionEvent.round2EndAt);

  if (sessionEvent.status === 'recruiting_round1') {
    return {
      canSubmit: isWithinWindow(now, round1StartAt, round1EndAt),
      round: 1 as const,
      reason: isWithinWindow(now, round1StartAt, round1EndAt)
        ? null
        : 'round1 の募集期間外です',
    };
  }

  if (sessionEvent.status === 'recruiting_round2') {
    return {
      canSubmit: isWithinWindow(now, round2StartAt, round2EndAt),
      round: 2 as const,
      reason: isWithinWindow(now, round2StartAt, round2EndAt)
        ? null
        : 'round2 の募集期間外です',
    };
  }

  return {
    canSubmit: false,
    round: null,
    reason: '現在は募集受付中ではありません',
  };
}