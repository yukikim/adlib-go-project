export const SESSION_EVENT_STATUS_VALUES = [
  'draft',
  'announced',
  'recruiting_round1',
  'recruiting_round2',
  'generating',
  'published',
  'rating',
  'closed',
] as const;

export type SessionEventStatus = (typeof SESSION_EVENT_STATUS_VALUES)[number];

const SESSION_EVENT_STATUS_LABELS: Record<SessionEventStatus, string> = {
  draft: '下書き',
  announced: '告知',
  recruiting_round1: '募集（ラウンド1）',
  recruiting_round2: '募集（ラウンド2）',
  generating: '生成中',
  published: '公開',
  rating: 'レイティング',
  closed: '終了',
};

export function isSessionEventStatus(value: string): value is SessionEventStatus {
  return SESSION_EVENT_STATUS_VALUES.includes(value as SessionEventStatus);
}

export function normalizeSessionEventStatus(value: string): SessionEventStatus {
  return isSessionEventStatus(value) ? value : 'draft';
}

export function getSessionEventStatusLabel(status: string) {
  const normalizedStatus = normalizeSessionEventStatus(status);
  return SESSION_EVENT_STATUS_LABELS[normalizedStatus];
}

export function isSessionEventVisibleToMembers(status: string) {
  const normalizedStatus = normalizeSessionEventStatus(status);
  return normalizedStatus !== 'draft';
}

export function isSessionEventFinished(status: string) {
  return normalizeSessionEventStatus(status) === 'closed';
}

export function canRateSessionEvent(status: string) {
  return normalizeSessionEventStatus(status) === 'rating';
}