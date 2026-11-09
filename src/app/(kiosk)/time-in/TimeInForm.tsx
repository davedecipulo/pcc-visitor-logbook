"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, startTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { timeIn, type TimeInState } from "../actions";
import { OFFICES, PURPOSES } from "@/lib/config";
import { formatTime } from "@/lib/format";
import { Field, SectionTitle, Spinner, cancelClass, inputClass } from "@/components/kiosk/Field";
import { useIdleReturn } from "@/components/kiosk/useIdleReturn";

const SUCCESS_RETURN_SECONDS = 10;

export function TimeInForm() {
  const [state, formAction, pending] = useActionState<TimeInState, FormData>(timeIn, {
    status: "idle",
  });

  const initial = state.status === "error" ? state.values : undefined;
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [office, setOffice] = useState(initial?.office_to_visit ?? "");

  useIdleReturn(120_000, state.status !== "success");

  if (state.status === "success") return <TimeInSuccess state={state} />;

  const errors = state.status === "error" ? state.fieldErrors : {};
  const v = (k: string) => (state.status === "error" ? state.values[k] : undefined);
  const invalid = (k: string) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});

  // Submit manually so React doesn't reset the form; on a validation error
  // the visitor keeps everything they typed.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="glass relative w-full max-w-4xl animate-fade-up overflow-hidden rounded-[2rem] p-6 sm:p-10"
    >
      {/* top accent line */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="hidden h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_30px_-4px_rgb(52_211_153/0.6)] sm:grid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden>
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Visitor Time In</h1>
            <p className="text-white/50">
              Fields marked <span className="text-flame-400">*</span> are required.
            </p>
          </div>
        </div>
        <Link href="/" className={cancelClass}>
          ✕ <span className="hidden sm:inline">Cancel</span>
        </Link>
      </div>

      {state.status === "error" && (
        <div role="alert" className="mt-6 flex items-center gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 font-medium text-rose-200">
          <span aria-hidden className="text-lg">⚠</span>
          {state.message}
        </div>
      )}

      {/* Visitor details */}
      <fieldset className="mt-8">
        <SectionTitle step={1}>Your details</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="full_name" required error={errors.full_name} className="sm:col-span-2">
            <input id="full_name" name="full_name" autoComplete="off" autoCapitalize="words" defaultValue={v("full_name")} placeholder="Juan Dela Cruz" className={inputClass} {...invalid("full_name")} />
          </Field>
          <Field label="Contact number" htmlFor="contact_number" required error={errors.contact_number}>
            <input id="contact_number" name="contact_number" type="tel" inputMode="tel" autoComplete="off" defaultValue={v("contact_number")} placeholder="0917 123 4567" className={inputClass} {...invalid("contact_number")} />
          </Field>
          <Field label="Address" htmlFor="address" required error={errors.address}>
            <input id="address" name="address" autoComplete="off" defaultValue={v("address")} placeholder="Barangay, City/Municipality" className={inputClass} {...invalid("address")} />
          </Field>
        </div>
      </fieldset>

      <Divider />

      {/* Visit details */}
      <fieldset>
        <SectionTitle step={2}>Purpose of visit</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Purpose" htmlFor="purpose" required error={errors.purpose}>
            <select id="purpose" name="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputClass} {...invalid("purpose")}>
              <option value="" disabled>Select purpose…</option>
              {PURPOSES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Office / place to visit" htmlFor="office_to_visit" required error={errors.office_to_visit}>
            <select id="office_to_visit" name="office_to_visit" value={office} onChange={(e) => setOffice(e.target.value)} className={inputClass} {...invalid("office_to_visit")}>
              <option value="" disabled>Select office…</option>
              {OFFICES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>

          {office === "Other" && (
            <Field label="Specify office / place" htmlFor="office_other" required error={errors.office_other} className="animate-fade-up">
              <input id="office_other" name="office_other" autoComplete="off" defaultValue={v("office_other")} className={inputClass} {...invalid("office_other")} />
            </Field>
          )}

          <Field label="Person to visit" htmlFor="person_to_visit" error={errors.person_to_visit} hint="e.g. Ms. Santos, Registrar">
            <input id="person_to_visit" name="person_to_visit" autoComplete="off" defaultValue={v("person_to_visit")} className={inputClass} {...invalid("person_to_visit")} />
          </Field>

          <Field
            label={purpose === "Other" ? "Please describe your purpose" : "Details"}
            htmlFor="purpose_details"
            required={purpose === "Other"}
            error={errors.purpose_details}
            className="sm:col-span-2"
          >
            <input id="purpose_details" name="purpose_details" autoComplete="off" defaultValue={v("purpose_details")} placeholder="e.g. Request for Transcript of Records" className={inputClass} {...invalid("purpose_details")} />
          </Field>
        </div>
      </fieldset>

      <Divider />

      {/* Student */}
      <fieldset>
        <SectionTitle step={3}>Visiting a student?</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Student's name" htmlFor="student_name" required={purpose === "Visit a Student"} error={errors.student_name}>
            <input id="student_name" name="student_name" autoComplete="off" defaultValue={v("student_name")} className={inputClass} {...invalid("student_name")} />
          </Field>
          <Field label="Course / Year / Section" htmlFor="student_course_year" error={errors.student_course_year} hint="e.g. BSED 2-A">
            <input id="student_course_year" name="student_course_year" autoComplete="off" defaultValue={v("student_course_year")} className={inputClass} {...invalid("student_course_year")} />
          </Field>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="group relative mt-10 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-5 text-xl font-bold tracking-wide text-white shadow-[0_10px_40px_-10px_rgb(20_184_166/0.8)] transition duration-300 hover:shadow-[0_10px_50px_-6px_rgb(20_184_166/0.9)] hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 sm:text-2xl"
      >
        {/* moving sheen */}
        <span aria-hidden className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_35%,rgb(255_255_255/0.25)_50%,transparent_65%)] bg-[length:200%_100%]" />
        <span className="relative inline-flex items-center gap-3">
          {pending ? (
            <>
              <Spinner /> Saving…
            </>
          ) : (
            <>
              Submit &amp; Time In
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </>
          )}
        </span>
      </button>
    </form>
  );
}

function Divider() {
  return <div aria-hidden className="my-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />;
}

function TimeInSuccess({ state }: { state: Extract<TimeInState, { status: "success" }> }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(SUCCESS_RETURN_SECONDS);

  useEffect(() => {
    if (seconds <= 0) {
      router.replace("/");
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, router]);

  return (
    <div className="glass relative mt-4 w-full max-w-xl animate-fade-up overflow-hidden rounded-[2rem] p-8 text-center sm:p-10">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

      <div className="relative mx-auto grid h-28 w-28 animate-pop place-items-center">
        <span className="absolute inset-0 animate-ping-slow rounded-full bg-emerald-400/30" />
        <span className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl" />
        <span className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-5xl font-bold text-white shadow-[0_0_40px_rgb(52_211_153/0.6)]">
          ✓
        </span>
      </div>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">You&apos;re checked in!</h1>
      <p className="mt-2 text-xl text-white/70">{state.fullName}</p>

      <div className="mt-8 grid grid-cols-2 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/5">
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Log No.</p>
          <p className="mt-1 font-mono text-3xl font-bold text-lilac-300">#{state.logNo}</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Time in</p>
          <p className="mt-1 text-3xl font-bold">{formatTime(state.timeIn)}</p>
        </div>
      </div>

      <p className="mt-6 rounded-xl border border-flame-400/30 bg-flame-500/10 px-4 py-3 text-lg font-medium text-flame-400">
        Please remember to <strong>TIME OUT</strong> before leaving the campus.
      </p>

      <Link
        href="/"
        replace
        className="relative mt-8 inline-flex items-center gap-3 overflow-hidden rounded-full border border-white/15 bg-white/10 px-8 py-3 font-semibold transition hover:bg-white/20"
      >
        Done
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 font-mono text-sm tabular-nums">{seconds}</span>
      </Link>
    </div>
  );
}
