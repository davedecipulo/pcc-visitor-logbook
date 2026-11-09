"use client";

import { useFormStatus } from "react-dom";
import { forceTimeOut } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-3.5 py-1.5 text-sm font-medium text-rose-200 transition hover:border-rose-400/60 hover:bg-rose-500/20 hover:text-white disabled:opacity-50"
    >
      {pending ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-200/30 border-t-rose-200" />
      ) : (
        <span aria-hidden>⏏</span>
      )}
      Time out
    </button>
  );
}

export function ForceTimeOutButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={forceTimeOut}
      onSubmit={(e) => {
        if (!confirm(`Record time-out for ${name} now?`)) e.preventDefault();
      }}
      className="no-print"
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton />
    </form>
  );
}
