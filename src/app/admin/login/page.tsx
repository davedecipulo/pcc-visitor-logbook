import type { Metadata } from "next";
import Link from "next/link";
import { Backdrop } from "@/components/Backdrop";
import { GlowLogo } from "@/components/SchoolLogo";
import { SCHOOL } from "@/lib/config";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Staff Login · PCC Visitor Logbook" };

export default function LoginPage() {
  return (
    <div className="admin relative flex min-h-screen items-center justify-center overflow-hidden bg-void-900 p-4 text-white">
      <Backdrop />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex animate-pop flex-col items-center text-center">
          <GlowLogo size={96} />
          <p className="mt-6 text-xl font-bold tracking-tight">{SCHOOL.name}</p>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-lilac-300/80">Visitor Logbook · Staff</p>
        </div>
        <div className="glass relative animate-fade-up overflow-hidden rounded-[2rem] p-8" style={{ animationDelay: "120ms" }}>
          <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
          <h1 className="text-2xl font-extrabold tracking-tight">Staff sign in</h1>
          <p className="mt-1 text-sm text-white/50">For guards and administrators only.</p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-white/50 transition hover:text-white">
            ← Back to visitor kiosk
          </Link>
        </p>
      </div>
    </div>
  );
}
