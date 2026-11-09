import Link from "next/link";
import { GlowLogo } from "@/components/SchoolLogo";
import { SpotlightLink } from "@/components/kiosk/Spotlight";

const cardBase =
  "group glass relative flex flex-col items-center overflow-hidden rounded-[2rem] px-8 py-10 text-center transition duration-300 hover:-translate-y-1.5 active:scale-[0.98] focus:outline-none focus-visible:ring-4 sm:py-12";

export default function KioskHome() {
  return (
    <div className="flex w-full max-w-5xl flex-col items-center pt-2 text-center sm:pt-6">
      <div className="animate-pop">
        <div className="animate-float">
          <GlowLogo size={150} />
        </div>
      </div>

      <p
        className="mt-10 animate-fade-up rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-lilac-300"
        style={{ animationDelay: "120ms" }}
      >
        Visitor Check-in Kiosk
      </p>
      <h1
        className="text-gradient mt-5 animate-fade-up text-4xl font-extrabold tracking-tight sm:text-6xl"
        style={{ animationDelay: "200ms" }}
      >
        Welcome to PCC
      </h1>
      <p
        className="mt-4 max-w-xl animate-fade-up text-lg text-white/70 sm:text-xl"
        style={{ animationDelay: "280ms" }}
      >
        Good day! Please sign the visitor logbook. Tap an option below to begin.
      </p>

      <div className="mt-10 grid w-full gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-7">
        <SpotlightLink
          href="/time-in"
          className={`${cardBase} animate-fade-up hover:border-emerald-400/50 hover:shadow-[0_0_60px_-10px_rgb(52_211_153/0.5)] focus-visible:ring-emerald-400/60 [--glow:rgb(52_211_153/0.28)]`}
          style={{ animationDelay: "360ms" }}
        >
          <ActionIcon tone="in" />
          <p className="mt-6 text-3xl font-black tracking-wide sm:text-4xl">TIME IN</p>
          <p className="mt-2 text-white/60">I am arriving on campus</p>
          <Cta className="text-emerald-300">Start check-in</Cta>
        </SpotlightLink>

        <SpotlightLink
          href="/time-out"
          className={`${cardBase} animate-fade-up hover:border-rose-400/50 hover:shadow-[0_0_60px_-10px_rgb(251_113_133/0.5)] focus-visible:ring-rose-400/60 [--glow:rgb(251_113_133/0.28)]`}
          style={{ animationDelay: "440ms" }}
        >
          <ActionIcon tone="out" />
          <p className="mt-6 text-3xl font-black tracking-wide sm:text-4xl">TIME OUT</p>
          <p className="mt-2 text-white/60">I am leaving the campus</p>
          <Cta className="text-rose-300">Start check-out</Cta>
        </SpotlightLink>
      </div>

      <Link
        href="/admin"
        className="mt-12 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-white/30 transition hover:bg-white/5 hover:text-white/70"
      >
        <span aria-hidden>⚙</span> Staff login
      </Link>
    </div>
  );
}

function ActionIcon({ tone }: { tone: "in" | "out" }) {
  const isIn = tone === "in";
  return (
    <div className="relative grid h-24 w-24 place-items-center">
      <div
        className={`absolute inset-0 rounded-full opacity-60 blur-xl transition duration-500 group-hover:opacity-100 ${
          isIn ? "bg-emerald-500/50" : "bg-rose-500/50"
        }`}
      />
      <div
        className={`relative grid h-24 w-24 place-items-center rounded-full border transition duration-500 group-hover:scale-110 ${
          isIn
            ? "border-emerald-300/40 bg-gradient-to-br from-emerald-400 to-teal-600"
            : "border-rose-300/40 bg-gradient-to-br from-rose-400 to-orange-600"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-11 w-11 text-white" aria-hidden>
          {isIn ? (
            <>
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="m10 17 5-5-5-5" className="transition-transform duration-300 group-hover:translate-x-0.5" />
              <path d="M15 12H3" />
            </>
          ) : (
            <>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" className="transition-transform duration-300 group-hover:translate-x-0.5" />
              <path d="M21 12H9" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

function Cta({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest ${className}`}>
      {children}
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
    </span>
  );
}
