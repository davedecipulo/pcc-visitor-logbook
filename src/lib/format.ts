import { TIMEZONE } from "./config";

const dateTimeFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIMEZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
});

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

/** YYYY-MM-DD in Philippine time. */
export const toManilaYmd = (date: Date) => ymdFmt.format(date);

/** Start of a Manila calendar day (YYYY-MM-DD) as an ISO timestamp. Manila is UTC+8, no DST. */
export const manilaDayStart = (ymd: string) => new Date(`${ymd}T00:00:00+08:00`).toISOString();

/** Start of the day AFTER the given Manila day, as an ISO timestamp (exclusive upper bound). */
export const manilaDayEnd = (ymd: string) =>
  new Date(new Date(`${ymd}T00:00:00+08:00`).getTime() + 86_400_000).toISOString();

export function formatDuration(fromIso: string, toIso: string | null, now: number) {
  const end = toIso ? new Date(toIso).getTime() : now;
  const mins = Math.max(0, Math.round((end - new Date(fromIso).getTime()) / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** 09171234567 → 0917 123 4567 */
export const formatPhone = (p: string) =>
  p.length === 11 ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p;

/** Normalizes PH mobile numbers to 09XXXXXXXXX. Returns null if invalid. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "");
  if (/^09\d{9}$/.test(digits)) return digits;
  if (/^\+639\d{9}$/.test(digits)) return `0${digits.slice(3)}`;
  if (/^639\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  return null;
}

export const isYmd = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

/**
 * Current time for a Server Component render. Server Components render once per
 * request (never re-render on the client), so reading the clock here is safe.
 */
export const requestTime = () => Date.now();
