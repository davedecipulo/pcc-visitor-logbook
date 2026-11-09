import Image from "next/image";
import { SCHOOL } from "@/lib/config";

/** The PCC seal. Set SCHOOL.logoSrc in src/lib/config.ts to change it. */
export function SchoolLogo({ size = 64 }: { size?: number }) {
  if (SCHOOL.logoSrc) {
    return (
      <Image
        src={SCHOOL.logoSrc}
        alt={`${SCHOOL.name} logo`}
        width={size}
        height={size}
        className="shrink-0 rounded-full bg-white object-contain"
        priority
      />
    );
  }

  return (
    <div
      aria-label="Logo placeholder"
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-current/40 text-[10px] font-semibold uppercase tracking-wider opacity-70"
    >
      Logo
    </div>
  );
}

/**
 * The seal inside animated, glowing rings (flame orange + book lilac).
 * Used as the hero on the kiosk screens.
 */
export function GlowLogo({ size = 160 }: { size?: number }) {
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      {/* soft halo */}
      <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-flame-500/40 via-lilac-400/30 to-cyan-400/30 blur-2xl" />
      {/* spinning conic ring */}
      <div
        className="absolute -inset-[5px] animate-spin-slow rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, #f97316 18%, transparent 35%, #a78bfa 55%, transparent 70%, #22d3ee 88%, transparent 100%)",
        }}
      />
      {/* dashed orbit */}
      <div className="absolute -inset-4 animate-spin-slower rounded-full border border-dashed border-white/20" />
      <div className="relative rounded-full bg-white p-[3px] shadow-[0_0_40px_rgb(249_115_22/0.35)]">
        <SchoolLogo size={size - 6} />
      </div>
    </div>
  );
}

export function SchoolHeader({ subtitle, size = 64 }: { subtitle?: string; size?: number }) {
  return (
    <div className="flex items-center gap-4">
      <SchoolLogo size={size} />
      <div className="leading-tight">
        <p className="text-xl font-bold tracking-tight sm:text-2xl">{SCHOOL.name}</p>
        <p className="text-sm opacity-80 sm:text-base">{subtitle ?? SCHOOL.system}</p>
      </div>
    </div>
  );
}
