"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Re-fetches server data periodically so the guard sees new arrivals live,
 * and shows a "Live" pill with a countdown ring.
 */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const id = setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        if (document.visibilityState === "visible") router.refresh();
        return seconds;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  const r = 7;
  const c = 2 * Math.PI * r;

  return (
    <div
      className="no-print inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 py-1 pl-2 pr-3 text-xs font-semibold text-emerald-200"
      title={`Refreshes every ${seconds} seconds`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      LIVE
      <svg viewBox="0 0 18 18" className="h-[18px] w-[18px] -rotate-90" aria-hidden>
        <circle cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={2} />
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - left / seconds)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span className="tabular-nums text-emerald-200/70">{left}s</span>
    </div>
  );
}
