"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "../actions";

const input =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white outline-none transition placeholder:text-white/30 hover:border-white/25 focus:border-violet-400/70 focus:bg-white/[0.09] focus:shadow-[0_0_0_4px_rgb(139_92_246/0.2),0_0_24px_-4px_rgb(139_92_246/0.6)]";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
          ⚠ {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-white/80">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} placeholder="you@pcc.edu.ph" className={input} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-white/80">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" className={input} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-flame-500 py-3.5 font-bold text-white shadow-[0_10px_40px_-10px_rgb(139_92_246/0.9)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
      >
        <span aria-hidden className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_35%,rgb(255_255_255/0.25)_50%,transparent_65%)] bg-[length:200%_100%]" />
        <span className="relative inline-flex items-center gap-2">
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Signing in…
            </>
          ) : (
            <>
              Sign in <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </>
          )}
        </span>
      </button>
    </form>
  );
}
