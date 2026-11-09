import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ForceTimeOutButton } from "@/components/admin/ForceTimeOutButton";
import { LoadingPulse } from "@/components/admin/LoadingPulse";
import { PrintButton } from "@/components/admin/PrintButton";
import { PURPOSES, SCHOOL } from "@/lib/config";
import { formatDateTime, formatDuration, formatPhone, formatTime, requestTime } from "@/lib/format";
import { applyFilters, filtersToSearch, PAGE_SIZE, parseFilters, type LogFilters } from "@/lib/logs-query";
import { createSessionClient } from "@/lib/supabase/server";
import type { Visitor } from "@/lib/types";

export const metadata: Metadata = { title: "Logbook · PCC Visitor Logbook" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function LogsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<LoadingPulse label="Loading logbook…" />}>
      <Logbook searchParams={searchParams} />
    </Suspense>
  );
}

async function Logbook({ searchParams }: { searchParams: SearchParams }) {
  const f = parseFilters(await searchParams);
  const supabase = await createSessionClient();
  const now = requestTime();

  const offset = (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await applyFilters(
    supabase.from("visitors").select("*", { count: "exact" }),
    f,
  )
    .order("time_in", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const rows = (data ?? []) as Visitor[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeLabel = f.from === f.to ? f.from : `${f.from} to ${f.to}`;

  return (
    <div className="space-y-5">
      <div className="no-print flex animate-fade-up flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-lilac-300/80">{rangeLabel}</p>
          <h1 className="text-gradient mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Visitor Logbook</h1>
          <p className="mt-1 text-white/50">
            <span className="font-semibold text-white">{total}</span> record{total === 1 ? "" : "s"} found
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/admin/logs/export?${filtersToSearch(f, { page: 1 })}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:border-white/30 hover:bg-white/10"
          >
            ⬇ Export Excel
          </a>
          <PrintButton />
        </div>
      </div>

      <Filters f={f} />

      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-lg font-bold">{SCHOOL.name} · Visitor Logbook</h1>
        <p className="text-sm">
          {rangeLabel} · {total} record{total === 1 ? "" : "s"}
          {f.purpose ? ` · Purpose: ${f.purpose}` : ""}
          {f.status !== "all" ? ` · ${f.status === "inside" ? "Still inside" : "Checked out"}` : ""}
        </p>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-200">
          ⚠ Could not load the logbook. Please try again.
        </div>
      ) : rows.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-3xl p-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-white/20 text-2xl">🔍</div>
          <p className="mt-4 text-white/50">No visitors found for these filters.</p>
        </div>
      ) : (
        <div
          className="glass animate-fade-up overflow-x-auto rounded-3xl print:overflow-visible print:rounded-none print:border-0"
          style={{ animationDelay: "150ms" }}
        >
          <table className="w-full text-left text-sm print:text-[10px]">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Visitor</th>
                <th className="px-4 py-3.5">Contact No.</th>
                <th className="px-4 py-3.5">Address</th>
                <th className="px-4 py-3.5">Purpose</th>
                <th className="px-4 py-3.5">Visiting</th>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5">Time in</th>
                <th className="px-4 py-3.5">Time out</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="no-print px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((v) => (
                <tr key={v.id} className="align-top transition hover:bg-white/[0.04]">
                  <td className="px-4 py-3.5 font-mono text-xs text-white/35">{v.log_no}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="no-print grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500/50 to-flame-500/40 text-xs font-bold">
                        {v.full_name.charAt(0).toUpperCase()}
                      </span>
                      <p className="font-semibold">{v.full_name}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-white/70">{formatPhone(v.contact_number)}</td>
                  <td className="max-w-48 px-4 py-3.5 text-white/60">{v.address}</td>
                  <td className="px-4 py-3.5">
                    <p>{v.purpose}</p>
                    {v.purpose_details && <p className="text-xs text-white/40">{v.purpose_details}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <p>{v.office_to_visit}</p>
                    {v.person_to_visit && <p className="text-xs text-white/40">{v.person_to_visit}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    {v.student_name ? (
                      <>
                        <p>{v.student_name}</p>
                        {v.student_course_year && <p className="text-xs text-white/40">{v.student_course_year}</p>}
                      </>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                    {f.from === f.to ? formatTime(v.time_in) : formatDateTime(v.time_in)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                    {v.time_out ? (
                      <>
                        {f.from === f.to ? formatTime(v.time_out) : formatDateTime(v.time_out)}
                        {v.timed_out_by === "admin" && (
                          <span className="ml-1.5 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/50" title="Timed out by staff">
                            STAFF
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                        <span className="no-print h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Inside
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-white/70">
                    {formatDuration(v.time_in, v.time_out, now)}
                  </td>
                  <td className="no-print px-4 py-3.5">
                    {!v.time_out && <ForceTimeOutButton id={v.id} name={v.full_name} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="no-print flex items-center justify-between text-sm">
          <span className="text-white/50">
            Page <span className="font-semibold text-white">{f.page}</span> of {pages}
          </span>
          <div className="flex gap-2">
            <PageLink f={f} page={f.page - 1} disabled={f.page <= 1}>← Previous</PageLink>
            <PageLink f={f} page={f.page + 1} disabled={f.page >= pages}>Next →</PageLink>
          </div>
        </nav>
      )}
    </div>
  );
}

function PageLink({ f, page, disabled, children }: { f: LogFilters; page: number; disabled: boolean; children: React.ReactNode }) {
  if (disabled) return <span className="rounded-full px-4 py-2 text-white/20">{children}</span>;
  return (
    <Link
      href={`/admin/logs?${filtersToSearch(f, { page })}`}
      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 font-medium transition hover:border-white/30 hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

const field =
  "rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 hover:border-white/25 focus:border-violet-400/70 focus:shadow-[0_0_0_3px_rgb(139_92_246/0.2)]";
const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-white/40";

function Filters({ f }: { f: LogFilters }) {
  return (
    <form
      method="GET"
      className="glass no-print grid animate-fade-up gap-3 rounded-3xl p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-6"
      style={{ animationDelay: "80ms" }}
    >
      <label className={labelCls}>
        From
        <input type="date" name="from" defaultValue={f.from} className={`${field} mt-1.5 w-full`} />
      </label>
      <label className={labelCls}>
        To
        <input type="date" name="to" defaultValue={f.to} className={`${field} mt-1.5 w-full`} />
      </label>
      <label className={`${labelCls} lg:col-span-2`}>
        Search
        <input name="q" defaultValue={f.q} placeholder="Name, student, office, person, address…" className={`${field} mt-1.5 w-full normal-case tracking-normal`} />
      </label>
      <label className={labelCls}>
        Purpose
        <select name="purpose" defaultValue={f.purpose} className={`${field} mt-1.5 w-full normal-case tracking-normal`}>
          <option value="">All purposes</option>
          {PURPOSES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </label>
      <label className={labelCls}>
        Status
        <select name="status" defaultValue={f.status} className={`${field} mt-1.5 w-full normal-case tracking-normal`}>
          <option value="all">All</option>
          <option value="inside">Still inside</option>
          <option value="out">Checked out</option>
        </select>
      </label>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-6 lg:justify-end">
        <Link href="/admin/logs" className="rounded-full px-4 py-2 text-sm font-medium text-white/50 transition hover:bg-white/10 hover:text-white">
          Reset
        </Link>
        <button className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgb(139_92_246/0.8)] transition hover:brightness-110">
          Apply filters
        </button>
      </div>
    </form>
  );
}
