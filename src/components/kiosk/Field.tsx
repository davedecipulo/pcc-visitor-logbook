import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-lg text-white shadow-inner outline-none transition duration-200 placeholder:text-white/30 hover:border-white/25 focus:border-cyan-400/70 focus:bg-white/[0.09] focus:shadow-[0_0_0_4px_rgb(34_211_238/0.15),0_0_24px_-4px_rgb(34_211_238/0.5)] aria-[invalid=true]:border-rose-400/80 aria-[invalid=true]:shadow-[0_0_0_4px_rgb(251_113_133/0.15)]";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 flex items-baseline gap-2 text-sm font-semibold tracking-wide text-white/80">
        {label}
        {required ? (
          <span className="text-flame-400">*</span>
        ) : (
          <span className="text-xs font-normal text-white/35">(optional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-rose-300">
          <span aria-hidden>⚠</span> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-white/40">{hint}</p>
      ) : null}
    </div>
  );
}

/** Numbered section heading used inside kiosk forms. */
export function SectionTitle({ step, children }: { step: number; children: ReactNode }) {
  return (
    <legend className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-lilac-300">
      <span className="grid h-7 w-7 place-items-center rounded-full border border-lilac-300/40 bg-lilac-400/10 font-mono text-[11px] tracking-normal">
        {step}
      </span>
      {children}
    </legend>
  );
}

export function Spinner() {
  return <span aria-hidden className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}

/** "✕ Cancel" pill used in kiosk card headers. */
export const cancelClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/60 transition hover:border-white/25 hover:bg-white/10 hover:text-white";
