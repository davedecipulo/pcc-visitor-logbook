import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { CountUp } from "@/components/admin/CountUp";
import { ForceTimeOutButton } from "@/components/admin/ForceTimeOutButton";
import { LoadingPulse } from "@/components/admin/LoadingPulse";
import { OVERSTAY_HOURS, TIMEZONE } from "@/lib/config";
import { formatDateTime, formatDuration, formatPhone, formatTime, requestTime, manilaDayStart, toManilaYmd } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";
import type { Visitor } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard · PCC Visitor Logbook" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingPulse label="Loading dashboard…" />}>
      <Dashboard />
    </Suspense>
  );
}

const hourFmt = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", hourCycle: "h23" });
const manilaHour = (d: Date | string) => Number(hourFmt.format(new Date(d))) % 24;
const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

async function Dashboard() {
  const supabase = await createSessionClient();
  const now = requestTime();
  const today = toManilaYmd(new Date(now));
  const todayStart = manilaDayStart(today);

  const [insideRes, todayRes] = await Promise.all([
    supabase.from("visitors").select("*").is("time_out", null).order("time_in", { ascending: true }),
    supabase
      .from("visitors")
      .select("purpose, office_to_visit, time_in, time_out")
      .gte("time_in", todayStart)
      .limit(5000),
  ]);

  if (insideRes.error || todayRes.error) {
    console.error(insideRes.error ?? todayRes.error);
    return <ErrorBox />;
  }

  const inside = insideRes.data as Visitor[];
  const todayRows = todayRes.data as Pick<Visitor, "purpose" | "office_to_visit" | "time_in" | "time_out">[];
  const checkedOut = todayRows.filter((r) => r.time_out).length;
  const overstayMs = OVERSTAY_HOURS * 3_600_000;
  const overstay = inside.filter((v) => now - new Date(v.time_in).getTime() > overstayMs);

  const topPurposes = countBy(todayRows.map((r) => r.purpose)).slice(0, 5);
  const topOffices = countBy(todayRows.map((r) => r.office_to_visit)).slice(0, 5);

  // Arrivals per hour (Manila time), shown from 6am-8pm and stretched if needed
  const perHour = Array<number>(24).fill(0);
  todayRows.forEach((r) => perHour[manilaHour(r.time_in)]++);
  const nowHour = manilaHour(new Date(now));
  const used = perHour.map((n, h) => (n ? h : -1)).filter((h) => h >= 0);
  const firstH = Math.min(6, ...used);
  const lastH = Math.max(20, nowHour, ...used);
  const hours = Array.from({ length: lastH - firstH + 1 }, (_, i) => firstH + i);

  const greeting = nowHour < 12 ? "Good morning" : nowHour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Intl.DateTimeFormat("en-PH", { dateStyle: "full", timeZone: TIMEZONE }).format(now);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex animate-fade-up flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-lilac-300/80">{dateLabel}</p>
          <h1 className="text-gradient mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{greeting}!</h1>
          <p className="mt-1 text-white/50">Here&apos;s who is on campus right now.</p>
        </div>
        <AutoRefresh seconds={30} />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Visitors today" value={todayRows.length} accent="from-violet-500 to-fuchsia-500" delay={0}
          icon={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>} />
        <Stat label="Currently inside" value={inside.length} accent="from-emerald-400 to-teal-500" delay={70} live
          icon={<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /></>} />
        <Stat label="Checked out today" value={checkedOut} accent="from-sky-400 to-cyan-500" delay={140}
          icon={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>} />
        <Stat
          label={`Inside > ${OVERSTAY_HOURS} hours`}
          value={overstay.length}
          accent={overstay.length ? "from-amber-400 to-flame-500" : "from-slate-500 to-slate-600"}
          delay={210}
          alert={overstay.length > 0}
          icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
        />
      </div>

      {/* Arrivals chart */}
      <Panel className="animate-fade-up" style={{ animationDelay: "250ms" }}>
        <PanelHead title="Arrivals by hour" sub="Today, Philippine time">
          {todayRows.length > 0 && (
            <p className="text-right text-xs text-white/50">
              Peak
              <span className="block text-base font-semibold text-white">
                {hourLabel(perHour.indexOf(Math.max(...perHour)))} · {Math.max(...perHour)}
              </span>
            </p>
          )}
        </PanelHead>
        <HourlyChart hours={hours} perHour={perHour} nowHour={nowHour} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* On campus */}
        <Panel className="animate-fade-up lg:col-span-2" style={{ animationDelay: "320ms" }}>
          <PanelHead title={`Currently on campus`} badge={inside.length}>
            <Link
              href="/admin/logs?status=inside"
              className="group inline-flex items-center gap-1 text-sm font-medium text-lilac-300 hover:text-white"
            >
              View in logbook
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </PanelHead>

          {inside.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-14 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-white/20 text-2xl">🏫</div>
              <p className="mt-4 text-white/50">No visitors on campus right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {inside.map((v, i) => {
                const elapsed = now - new Date(v.time_in).getTime();
                const over = elapsed > overstayMs;
                const pct = Math.min(100, (elapsed / overstayMs) * 100);
                const notToday = v.time_in < todayStart;
                return (
                  <li
                    key={v.id}
                    className={`group flex animate-fade-up flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-white/[0.04] ${over ? "bg-amber-500/[0.06]" : ""}`}
                    style={{ animationDelay: `${380 + i * 40}ms` }}
                  >
                    <div className="relative">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-500/50 to-flame-500/40 font-bold">
                        {v.full_name.charAt(0).toUpperCase()}
                      </span>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-void-900 ${over ? "bg-amber-400" : "bg-emerald-400"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {v.full_name}
                        <span className="ml-2 rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-white/40">#{v.log_no}</span>
                        {over && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                            ⚠ Overstay
                          </span>
                        )}
                      </p>
                      <p className="truncate text-sm text-white/50">
                        {v.purpose} · {v.office_to_visit}
                        {v.person_to_visit ? ` (${v.person_to_visit})` : ""}
                        {v.student_name ? ` · Student: ${v.student_name}` : ""}
                      </p>
                      <p className="text-xs text-white/35">{formatPhone(v.contact_number)}</p>
                    </div>
                    <div className="w-32 text-right text-sm">
                      <p className="text-white/45">In {notToday ? formatDateTime(v.time_in) : formatTime(v.time_in)}</p>
                      <p className={`font-semibold tabular-nums ${over ? "text-amber-300" : "text-white"}`}>
                        {formatDuration(v.time_in, null, now)}
                      </p>
                      <div
                        className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"
                        title={`${Math.round(pct)}% of the ${OVERSTAY_HOURS}-hour limit`}
                      >
                        <div
                          className={`h-full rounded-full ${over ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <ForceTimeOutButton id={v.id} name={v.full_name} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Breakdown title="Top purposes today" rows={topPurposes} total={todayRows.length} delay={380} />
          <Breakdown title="Top offices today" rows={topOffices} total={todayRows.length} delay={440} />
        </div>
      </div>
    </div>
  );
}

function countBy(values: string[]) {
  const map = new Map<string, number>();
  values.forEach((v) => map.set(v, (map.get(v) ?? 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/* ---------------------------------------------------------------- pieces */

function Panel({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <section className={`glass overflow-hidden rounded-3xl ${className}`} style={style}>
      {children}
    </section>
  );
}

function PanelHead({ title, sub, badge, children }: { title: string; sub?: string; badge?: number; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          {title}
          {badge !== undefined && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-white/70">{badge}</span>
          )}
        </h2>
        {sub && <p className="text-xs text-white/40">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
  delay,
  live,
  alert,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  accent: string;
  delay: number;
  live?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className={`glass group relative animate-fade-up overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1 ${
        alert ? "ring-1 ring-amber-400/40" : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* corner glow */}
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition duration-500 group-hover:opacity-40`} />
      <div className="relative flex items-start justify-between">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${accent} shadow-lg`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
            {icon}
          </svg>
        </span>
        {live && (
          <span className="relative mt-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
        )}
        {alert && <span className="animate-pulse text-lg text-amber-300">⚠</span>}
      </div>
      <p className="relative mt-4 text-4xl font-extrabold tracking-tight">
        <CountUp value={value} />
      </p>
      <p className="relative mt-1 text-sm text-white/50">{label}</p>
    </div>
  );
}

/** Single-series bar chart (one hue), per-bar hover/focus tooltip, plus a screen-reader table. */
function HourlyChart({ hours, perHour, nowHour }: { hours: number[]; perHour: number[]; nowHour: number }) {
  const max = Math.max(...hours.map((h) => perHour[h]));
  const top = max <= 4 ? 4 : Math.ceil(max / 4) * 4;
  const ticks = [top, top / 2, 0];

  return (
    <div className="px-5 pb-5 pt-6">
      <div className="flex gap-3">
        {/* y axis */}
        <div className="flex h-44 flex-col justify-between pb-0 text-right text-[11px] tabular-nums text-white/35" aria-hidden>
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <div className="relative flex-1">
          {/* recessive grid */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44" aria-hidden>
            {ticks.map((t, i) => (
              <div key={t} className={`absolute inset-x-0 border-t ${i === ticks.length - 1 ? "border-white/20" : "border-dashed border-white/[0.07]"}`} style={{ top: `${(i / (ticks.length - 1)) * 100}%` }} />
            ))}
          </div>

          {/* bars: 2px gap between neighbours, 4px rounded tops anchored to the baseline */}
          <div className="relative flex h-44 items-end gap-[2px]" aria-hidden>
            {hours.map((h) => {
              const n = perHour[h];
              return (
                <div key={h} className="group relative flex h-full flex-1 items-end outline-none">
                  {/* full-height hit area */}
                  <div className="absolute inset-0 rounded-md transition group-hover:bg-white/[0.04] group-focus-visible:bg-white/[0.06]" />
                  <div
                    className="relative w-full origin-bottom animate-[grow_0.8s_cubic-bezier(0.16,1,0.3,1)_both] rounded-t-[4px] bg-[#8b5cf6] transition group-hover:brightness-125"
                    style={{ height: n ? `${(n / top) * 100}%` : 0, animationDelay: `${300 + (h - hours[0]) * 25}ms` }}
                  />
                  {/* tooltip */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-void-800/95 px-2.5 py-1.5 text-xs opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="text-white/50">{hourLabel(h)}–{hourLabel((h + 1) % 24)}</span>
                    <span className="ml-2 font-semibold text-white">{n} {n === 1 ? "arrival" : "arrivals"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* x axis */}
          <div className="mt-2 flex gap-[2px] text-[11px] text-white/35" aria-hidden>
            {hours.map((h) => (
              <span key={h} className={`flex-1 text-center ${h === nowHour ? "font-semibold text-lilac-300" : ""}`}>
                {h === nowHour ? "now" : (h - hours[0]) % 2 === 0 ? hourLabel(h) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Visitor arrivals per hour today</caption>
        <thead><tr><th>Hour</th><th>Arrivals</th></tr></thead>
        <tbody>
          {hours.map((h) => (
            <tr key={h}><td>{hourLabel(h)}</td><td>{perHour[h]}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Breakdown({ title, rows, total, delay }: { title: string; rows: [string, number][]; total: number; delay: number }) {
  return (
    <Panel className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <PanelHead title={title} />
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-white/40">No visitors yet today.</p>
      ) : (
        <ul className="space-y-4 px-5 py-5">
          {rows.map(([name, count], i) => {
            const pct = Math.round((count / total) * 100);
            return (
              <li key={name} className="group">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-[11px] text-white/30">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate text-white/80 group-hover:text-white">{name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold">{count}</span>
                    <span className="ml-1.5 text-xs text-white/40">{pct}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full origin-left animate-[grow-x_0.9s_cubic-bezier(0.16,1,0.3,1)_both] rounded-full bg-[#8b5cf6]"
                    style={{ width: `${pct}%`, animationDelay: `${delay + 100 + i * 60}ms` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function ErrorBox() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-200">
      <span className="text-xl">⚠</span>
      Could not load data from Supabase. Check your connection and environment variables.
    </div>
  );
}
