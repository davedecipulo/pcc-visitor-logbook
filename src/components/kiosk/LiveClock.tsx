"use client";

import { useEffect, useState } from "react";
import { TIMEZONE } from "@/lib/config";

const timeFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIMEZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-2.5 text-white" suppressHydrationWarning>
      <span className="relative flex h-2.5 w-2.5" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>
      <div className="text-right">
        <p className="font-mono text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
          {now ? timeFmt.format(now) : "--:--:--"}
        </p>
        <p className="text-xs text-white/60 sm:text-sm">{now ? dateFmt.format(now) : " "}</p>
      </div>
    </div>
  );
}
