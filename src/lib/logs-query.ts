import "server-only";
import { PURPOSES } from "./config";
import { isYmd, manilaDayEnd, manilaDayStart, toManilaYmd } from "./format";

export type LogFilters = {
  from: string; // YYYY-MM-DD (Manila)
  to: string; // YYYY-MM-DD (Manila), inclusive
  q: string;
  purpose: string;
  status: "all" | "inside" | "out";
  page: number;
};

export const PAGE_SIZE = 50;

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function get(sp: RawParams, key: string): string {
  const v = sp instanceof URLSearchParams ? sp.get(key) : sp[key];
  return (Array.isArray(v) ? v[0] : v ?? "").trim();
}

export function parseFilters(sp: RawParams): LogFilters {
  const today = toManilaYmd(new Date());
  let from = isYmd(get(sp, "from")) ? get(sp, "from") : today;
  let to = isYmd(get(sp, "to")) ? get(sp, "to") : today;
  if (from > to) [from, to] = [to, from];

  const status = get(sp, "status");
  const purpose = get(sp, "purpose");
  const page = Number.parseInt(get(sp, "page"), 10);

  return {
    from,
    to,
    // Keep only characters that are safe inside a PostgREST or() filter
    q: get(sp, "q").replace(/[^\p{L}\p{N}\s.'-]/gu, "").slice(0, 80),
    purpose: (PURPOSES as readonly string[]).includes(purpose) ? purpose : "",
    status: status === "inside" || status === "out" ? status : "all",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function filtersToSearch(f: LogFilters, overrides: Partial<LogFilters> = {}) {
  const merged = { ...f, ...overrides };
  const p = new URLSearchParams();
  p.set("from", merged.from);
  p.set("to", merged.to);
  if (merged.q) p.set("q", merged.q);
  if (merged.purpose) p.set("purpose", merged.purpose);
  if (merged.status !== "all") p.set("status", merged.status);
  if (merged.page > 1) p.set("page", String(merged.page));
  return p.toString();
}

/**
 * Applies the logbook filters to a Supabase query on `visitors`.
 * Generic so it works for both .select() with count and plain selects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters<Q extends { gte: any; lt: any; eq: any; is: any; not: any; or: any }>(
  query: Q,
  f: LogFilters,
): Q {
  let q = query.gte("time_in", manilaDayStart(f.from)).lt("time_in", manilaDayEnd(f.to));
  if (f.purpose) q = q.eq("purpose", f.purpose);
  if (f.status === "inside") q = q.is("time_out", null);
  if (f.status === "out") q = q.not("time_out", "is", null);
  if (f.q) {
    const term = `%${f.q}%`;
    q = q.or(
      [
        `full_name.ilike.${term}`,
        `student_name.ilike.${term}`,
        `person_to_visit.ilike.${term}`,
        `office_to_visit.ilike.${term}`,
        `address.ilike.${term}`,
      ].join(","),
    );
  }
  return q;
}
