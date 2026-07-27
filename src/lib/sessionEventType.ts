import type { SessionEventStatus } from './sessionEventStatus';

export const SESSION_EVENT_TYPE_VALUES = [
  'song_request',
  'attendance_only',
] as const;

export type SessionEventType = (typeof SESSION_EVENT_TYPE_VALUES)[number];

const SESSION_EVENT_TYPE_LABELS: Record<SessionEventType, string> = {
  song_request: 'リクエスト曲あり（通常）',
  attendance_only: 'リクエスト曲なし（参加回答のみ）',
};

const ATTENDANCE_ONLY_STATUS_VALUES = [
  'draft',
  'announced',
  'published',
  'closed',
] as const satisfies readonly SessionEventStatus[];

export function getSessionEventTypeLabel(eventType: SessionEventType) {
  return SESSION_EVENT_TYPE_LABELS[eventType];
}

export function getAllowedSessionEventStatuses(eventType: SessionEventType) {
  return eventType === 'attendance_only'
    ? ATTENDANCE_ONLY_STATUS_VALUES
    : [
        'draft',
        'announced',
        'recruiting_round1',
        'recruiting_round2',
        'generating',
        'published',
        'rating',
        'closed',
      ] as const;
}

export function isSessionEventStatusAllowed(
  eventType: SessionEventType,
  status: SessionEventStatus,
) {
  return getAllowedSessionEventStatuses(eventType).some(
    (allowedStatus) => allowedStatus === status,
  );
}
