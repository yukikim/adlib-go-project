import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const jaEventDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
});

const jaTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  hour: '2-digit',
  minute: '2-digit',
});

const jaCurrencyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEventDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${jaEventDateFormatter.format(date)} ${jaTimeFormatter.format(date)}`;
}

export function formatEventSchedule(eventDate: string | Date, startTime?: string | Date | null, endTime?: string | Date | null) {
  const eventDateValue = eventDate instanceof Date ? eventDate : new Date(eventDate);
  const dateLabel = jaEventDateFormatter.format(eventDateValue);
  const startSource = startTime ?? (eventDateValue.getHours() === 0 && eventDateValue.getMinutes() === 0 ? null : eventDateValue);
  const startLabel = startSource ? jaTimeFormatter.format(startSource instanceof Date ? startSource : new Date(startSource)) : null;
  const endLabel = endTime ? jaTimeFormatter.format(endTime instanceof Date ? endTime : new Date(endTime)) : null;
  if (startLabel && endLabel) {
    return `${dateLabel} ${startLabel} - ${endLabel}`;
  }
  if (startLabel) {
    return `${dateLabel} ${startLabel}`;
  }
  return dateLabel;
}

export function formatYen(value: number) {
  return jaCurrencyFormatter.format(value);
}