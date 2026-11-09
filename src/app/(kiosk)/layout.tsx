import { Backdrop } from "@/components/Backdrop";
import { SchoolLogo } from "@/components/SchoolLogo";
import { LiveClock } from "@/components/kiosk/LiveClock";
import { SCHOOL } from "@/lib/config";

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kiosk relative flex min-h-screen flex-col overflow-hidden bg-void-900 text-white">
      <Backdrop />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-10 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-[2px] ring-2 ring-white/20 shadow-[0_0_24px_rgb(249_115_22/0.35)]">
            <SchoolLogo size={52} />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-tight sm:text-xl">{SCHOOL.name}</p>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-lilac-300/80">
              {SCHOOL.system}
            </p>
          </div>
        </div>
        <LiveClock />
      </header>

      <main className="relative z-10 flex flex-1 items-start justify-center px-4 pb-10 sm:px-8">
        {children}
      </main>

      <footer className="relative z-10 px-4 pb-4 text-center text-xs text-white/40">
        🔒 Your information is used only for campus security, in line with the Data Privacy Act of 2012.
      </footer>
    </div>
  );
}
