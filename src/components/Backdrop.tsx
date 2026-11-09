/** Animated aurora + grid background shared by the kiosk and admin screens. */
export function Backdrop({ subtle = false }: { subtle?: boolean }) {
  const o = subtle ? "opacity-60" : "";
  return (
    <div aria-hidden className={`no-print pointer-events-none fixed inset-0 ${o}`}>
      <div className="absolute -left-[15%] -top-[20%] h-[60vmax] w-[60vmax] animate-aurora rounded-full bg-lilac-400/20 blur-[120px]" />
      <div
        className="absolute -right-[20%] top-[10%] h-[55vmax] w-[55vmax] animate-aurora rounded-full bg-flame-500/15 blur-[120px]"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute -bottom-[30%] left-[20%] h-[50vmax] w-[50vmax] animate-aurora rounded-full bg-cyan-500/15 blur-[120px]"
        style={{ animationDelay: "-12s" }}
      />
      <div className="bg-grid absolute inset-0" />
    </div>
  );
}
