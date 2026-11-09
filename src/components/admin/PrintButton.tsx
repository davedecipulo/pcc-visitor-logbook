"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgb(139_92_246/0.8)] transition hover:brightness-110"
    >
      🖨 Print
    </button>
  );
}
