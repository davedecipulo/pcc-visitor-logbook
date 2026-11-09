export function LoadingPulse({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-white/50">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-lilac-300" />
      {label}
    </div>
  );
}
