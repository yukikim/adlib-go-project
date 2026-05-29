import type { SessionEventView } from './types';

export type RunPortalActionOptions = {
  onSuccess?: (message?: string) => void;
  onError?: (message: string) => void;
  skipGlobalMessage?: boolean;
};

export type RunPortalAction = (
  action: () => Promise<void>,
  successMessage?: string,
  options?: RunPortalActionOptions,
) => Promise<void>;

export function formatDateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function formatDateLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function formatTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(11, 16);
}

export function formatDateInputToIso(value?: string | null) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toISOString();
}

export function combineDateAndTimeToIso(dateValue?: string | null, timeValue?: string | null) {
  if (!dateValue || !timeValue) return null;
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

export function getEventEntryState(event?: SessionEventView | null) {
  if (!event) {
    return { canSubmit: false, round: null as 1 | 2 | null, reason: 'イベントを選択してください' };
  }

  if (typeof event.canSubmit === 'boolean') {
    return {
      canSubmit: event.canSubmit,
      round: event.entryRound ?? null,
      reason: event.entryReason ?? null,
    };
  }

  const now = new Date();
  const active = (start?: string | null, end?: string | null) => {
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;
    return true;
  };

  if (event.status === 'recruiting_round1') {
    const canSubmit = active(event.round1StartAt, event.round1EndAt);
    return { canSubmit, round: 1 as const, reason: canSubmit ? null : 'round1 の募集期間外です' };
  }
  if (event.status === 'recruiting_round2') {
    const canSubmit = active(event.round2StartAt, event.round2EndAt);
    return { canSubmit, round: 2 as const, reason: canSubmit ? null : 'round2 の募集期間外です' };
  }

  return { canSubmit: false, round: null as 1 | 2 | null, reason: '現在は募集受付中ではありません' };
}

export async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}