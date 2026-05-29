import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const jaEventDateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEventDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return jaEventDateTimeFormatter.format(date);
}