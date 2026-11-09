"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";

/** Shown instead of a blank "page couldn't load" if anything on the kiosk crashes. */
export default function KioskError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <div className="glass relative mt-4 w-full max-w-xl animate-fade-up overflow-hidden rounded-[2rem] p-8 text-center sm:p-10">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-500/15 text-4xl">⚠</div>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">Something went wrong</h1>
      <p className="mt-2 text-white/60">
        The kiosk couldn&apos;t finish that step. Please try again, or ask the guard for help.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-semibold transition hover:brightness-110"
        >
          Try again
        </button>
        <Link href="/" className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-semibold transition hover:bg-white/10">
          Back to start
        </Link>
      </div>
      {digest && <p className="mt-6 font-mono text-xs text-white/30">Error code: {digest}</p>}
    </div>
  );
}
