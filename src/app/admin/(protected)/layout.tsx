import { Suspense, type ReactNode } from "react";
import { Backdrop } from "@/components/Backdrop";
import { SchoolLogo } from "@/components/SchoolLogo";
import { AdminNav } from "@/components/admin/AdminNav";
import { LoadingPulse } from "@/components/admin/LoadingPulse";
import { SCHOOL } from "@/lib/config";
import { getAdminUser } from "@/lib/supabase/server";
import { signOut } from "../actions";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin relative flex min-h-screen flex-col bg-void-900 text-white">
      <Backdrop subtle />

      <header className="no-print sticky top-0 z-30 border-b border-white/10 bg-void-900/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-[2px] ring-2 ring-white/15 shadow-[0_0_20px_rgb(249_115_22/0.3)]">
              <SchoolLogo size={40} />
            </div>
            <div className="leading-tight">
              <p className="font-bold tracking-tight">{SCHOOL.name}</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-lilac-300/80">
                Visitor Logbook · Admin
              </p>
            </div>
          </div>
          <AdminNav />
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Suspense fallback={<LoadingPulse />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}

/** Authorization check: renders the page only for registered admins. */
async function AdminGate({ children }: { children: ReactNode }) {
  const user = await getAdminUser();
  if (!user) {
    return (
      <div className="glass mx-auto mt-16 max-w-md animate-fade-up rounded-3xl p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-500/15 text-3xl">🔒</div>
        <h1 className="mt-4 text-xl font-bold">Not authorized</h1>
        <p className="mt-2 text-white/60">
          Your account is not registered as a PCC visitor-log administrator.
        </p>
        <form action={signOut} className="mt-6">
          <button className="rounded-full bg-white/10 px-6 py-2.5 font-semibold transition hover:bg-white/20">
            Sign out
          </button>
        </form>
      </div>
    );
  }
  return children;
}

async function UserMenu() {
  const user = await getAdminUser();
  if (!user) return null;
  const initial = (user.email ?? "?").charAt(0).toUpperCase();
  return (
    <form action={signOut} className="flex items-center gap-3 text-sm">
      <div className="hidden items-center gap-2 md:flex">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-lilac-400 to-flame-500 text-sm font-bold">
          {initial}
        </span>
        <span className="max-w-48 truncate text-white/60">{user.email}</span>
      </div>
      <button className="rounded-full border border-white/10 px-4 py-1.5 font-medium text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white">
        Sign out
      </button>
    </form>
  );
}
