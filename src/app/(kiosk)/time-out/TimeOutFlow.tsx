"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { searchInside, timeOut, type InsideMatch, type TimeOutResult } from "../actions";
import { formatDuration, formatTime } from "@/lib/format";
import { Spinner, cancelClass, inputClass } from "@/components/kiosk/Field";
import { SpotlightButton } from "@/components/kiosk/Spotlight";
import { useIdleReturn } from "@/components/kiosk/useIdleReturn";

type Done = Extract<TimeOutResult, { ok: true }>;

export function TimeOutFlow() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InsideMatch[] | null>(null);
  const [selected, setSelected] = useState<InsideMatch | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [searching, startSearch] = useTransition();
  const latestQuery = useRef("");

  useIdleReturn(90_000, !done);

  // Debounced search as the visitor types
  useEffect(() => {
    const q = query.trim();
    latestQuery.current = q;
    if (q.length < 2) return;
    const id = setTimeout(() => {
      startSearch(async () => {
        const rows = await searchInside(q);
        if (latestQuery.current === q) setResults(rows);
      });
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  if (done) return <TimeOutSuccess done={done} />;

  return (
    <div className="glass relative w-full max-w-3xl animate-fade-up overflow-hidden rounded-[2rem] p-6 sm:p-10">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/80 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="hidden h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-orange-600 shadow-[0_0_30px_-4px_rgb(251_113_133/0.6)] sm:grid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Visitor Time Out</h1>
            <p className="text-white/50">
              {selected ? "Step 2 of 2 · Confirm it's you." : "Step 1 of 2 · Type your name to find your entry."}
            </p>
          </div>
        </div>
        <Link href="/" className={cancelClass}>
          ✕ <span className="hidden sm:inline">Cancel</span>
        </Link>
      </div>

      {/* progress bar */}
      <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-flame-400 transition-all duration-500"
          style={{ width: selected ? "100%" : "50%" }}
        />
      </div>

      {selected ? (
        <ConfirmStep match={selected} onBack={() => setSelected(null)} onDone={setDone} />
      ) : (
        <>
          <div className="relative mt-8">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-white/40" aria-hidden>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length < 2) setResults(null);
              }}
              placeholder="Your name…"
              autoComplete="off"
              aria-label="Search your name"
              className={`${inputClass} py-4 pl-14 text-2xl`}
            />
            {searching && (
              <span className="absolute right-5 top-1/2 -translate-y-1/2">
                <Spinner />
              </span>
            )}
          </div>

          <div className="mt-6 min-h-40" aria-live="polite">
            {query.trim().length < 2 ? (
              <p className="pt-6 text-center text-white/40">Enter at least 2 letters of your name.</p>
            ) : searching && !results ? (
              <ul className="space-y-3">
                {[0, 1].map((i) => (
                  <li key={i} className="h-20 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
                ))}
              </ul>
            ) : results && results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-white/60">
                No visitor inside with that name. Check the spelling, or ask the guard for help.
              </div>
            ) : (
              <ul className="space-y-3">
                {results?.map((r, i) => (
                  <li key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <SpotlightButton
                      type="button"
                      onClick={() => setSelected(r)}
                      className="group flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left transition duration-200 hover:border-rose-300/50 hover:bg-white/[0.08] active:scale-[0.99] [--glow:rgb(251_113_133/0.2)]"
                    >
                      <span className="flex items-center gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lilac-400/40 to-flame-500/40 text-lg font-bold">
                          {r.full_name.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <span className="block text-xl font-semibold">{r.full_name}</span>
                          <span className="text-white/50">{r.office_to_visit}</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3 text-right">
                        <span className="text-xs uppercase tracking-widest text-white/40">
                          Time in
                          <span className="block text-lg font-semibold normal-case tracking-normal text-white">{formatTime(r.time_in)}</span>
                        </span>
                        <span aria-hidden className="text-xl text-white/30 transition group-hover:translate-x-1 group-hover:text-rose-300">›</span>
                      </span>
                    </SpotlightButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ConfirmStep({
  match,
  onBack,
  onDone,
}: {
  match: InsideMatch;
  onBack: () => void;
  onDone: (d: Done) => void;
}) {
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await timeOut(match.id, digits);
      if (res.ok) onDone(res);
      else setError(res.message);
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 animate-fade-up">
      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lilac-400/50 to-flame-500/50 text-xl font-bold">
          {match.full_name.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-xl font-semibold">{match.full_name}</p>
          <p className="text-white/50">
            {match.office_to_visit} · Time in {formatTime(match.time_in)}
          </p>
        </div>
      </div>

      <label htmlFor="last4" className="mt-8 block text-center font-medium text-white/70">
        Enter the <strong className="text-white">last 4 digits</strong> of the contact number you registered with
      </label>

      {/* 4 glowing digit boxes, backed by one real input */}
      <div className="relative mx-auto mt-4 max-w-xs">
        <input
          id="last4"
          autoFocus
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
          aria-invalid={!!error}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
        />
        <div className={`grid grid-cols-4 gap-3 ${error ? "animate-[shake_0.4s]" : ""}`} aria-hidden>
          {[0, 1, 2, 3].map((i) => {
            const filled = i < digits.length;
            const active = i === digits.length;
            return (
              <div
                key={i}
                className={`grid aspect-square place-items-center rounded-2xl border font-mono text-4xl font-bold transition duration-200 ${
                  error
                    ? "border-rose-400/70 bg-rose-500/10"
                    : filled
                      ? "border-rose-300/60 bg-rose-400/10 shadow-[0_0_24px_-6px_rgb(251_113_133/0.7)]"
                      : active
                        ? "border-white/40 bg-white/10"
                        : "border-white/10 bg-white/5"
                }`}
              >
                {filled ? digits[i] : active ? <span className="h-8 w-0.5 animate-pulse bg-white/60" /> : ""}
              </div>
            );
          })}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-center font-medium text-rose-300">
          ⚠ {error}
        </p>
      )}

      <div className="mt-10 flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-2xl border border-white/15 py-4 text-lg font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={pending || digits.length !== 4}
          className="flex-[2] inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 py-4 text-xl font-bold shadow-[0_10px_40px_-10px_rgb(244_63_94/0.8)] transition duration-300 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
        >
          {pending ? (
            <>
              <Spinner /> Saving…
            </>
          ) : (
            "Confirm Time Out"
          )}
        </button>
      </div>
    </form>
  );
}

function TimeOutSuccess({ done }: { done: Done }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(8);

  useEffect(() => {
    if (seconds <= 0) {
      router.replace("/");
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, router]);

  const now = new Date(done.timeOut).getTime();

  return (
    <div className="glass relative mt-4 w-full max-w-xl animate-fade-up overflow-hidden rounded-[2rem] p-8 text-center sm:p-10">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400 to-transparent" />

      <div className="relative mx-auto grid h-28 w-28 animate-pop place-items-center">
        <span className="absolute inset-0 animate-ping-slow rounded-full bg-rose-400/30" />
        <span className="absolute inset-0 rounded-full bg-rose-500/30 blur-xl" />
        <span className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose-400 to-orange-600 text-5xl shadow-[0_0_40px_rgb(251_113_133/0.6)]">
          👋
        </span>
      </div>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Thank you for visiting!</h1>
      <p className="mt-2 text-xl text-white/70">{done.fullName}</p>

      <div className="mt-8 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/5">
        {[
          ["Time in", formatTime(done.timeIn)],
          ["Time out", formatTime(done.timeOut)],
          ["Duration", formatDuration(done.timeIn, done.timeOut, now)],
        ].map(([label, value]) => (
          <div key={label} className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
            <p className="mt-1 text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-white/60">Have a safe trip! 🙏</p>

      <Link
        href="/"
        replace
        className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-8 py-3 font-semibold transition hover:bg-white/20"
      >
        Done
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 font-mono text-sm tabular-nums">{seconds}</span>
      </Link>
    </div>
  );
}
