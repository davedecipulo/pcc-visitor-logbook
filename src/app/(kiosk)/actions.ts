"use server";

import { OFFICES, PURPOSES } from "@/lib/config";
import { normalizePhone } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/service";

// ---------------------------------------------------------------------------
// Time in
// ---------------------------------------------------------------------------

export type TimeInState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<string, string>>;
      values: Record<string, string>;
    }
  | { status: "success"; logNo: number; fullName: string; timeIn: string };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim().replace(/\s+/g, " ");

export async function timeIn(_prev: TimeInState, formData: FormData): Promise<TimeInState> {
  const values = {
    full_name: str(formData, "full_name"),
    contact_number: str(formData, "contact_number"),
    address: str(formData, "address"),
    purpose: str(formData, "purpose"),
    purpose_details: str(formData, "purpose_details"),
    office_to_visit: str(formData, "office_to_visit"),
    office_other: str(formData, "office_other"),
    person_to_visit: str(formData, "person_to_visit"),
    student_name: str(formData, "student_name"),
    student_course_year: str(formData, "student_course_year"),
  };

  const errors: Record<string, string> = {};
  const phone = normalizePhone(values.contact_number);

  if (values.full_name.length < 2 || values.full_name.length > 120)
    errors.full_name = "Please enter your full name.";
  if (!phone) errors.contact_number = "Enter a valid mobile number (e.g. 0917 123 4567).";
  if (values.address.length < 2 || values.address.length > 250)
    errors.address = "Please enter your address.";
  if (!(PURPOSES as readonly string[]).includes(values.purpose))
    errors.purpose = "Please choose a purpose.";
  if (values.purpose === "Other" && values.purpose_details.length < 2)
    errors.purpose_details = "Please describe your purpose.";
  if (values.purpose_details.length > 250) errors.purpose_details = "Too long (max 250 characters).";
  if (!(OFFICES as readonly string[]).includes(values.office_to_visit))
    errors.office_to_visit = "Please choose an office.";
  if (values.office_to_visit === "Other" && values.office_other.length < 2)
    errors.office_other = "Please specify the office or place.";
  if (values.office_other.length > 80) errors.office_other = "Too long (max 80 characters).";
  if (values.person_to_visit.length > 120) errors.person_to_visit = "Too long.";
  if (values.purpose === "Visit a Student" && values.student_name.length < 2)
    errors.student_name = "Please enter the student's name.";
  if (values.student_name.length > 120) errors.student_name = "Too long.";
  if (values.student_course_year.length > 80) errors.student_course_year = "Too long.";

  if (Object.keys(errors).length > 0 || !phone) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: errors,
      values,
    };
  }

  const office =
    values.office_to_visit === "Other" ? values.office_other : values.office_to_visit;

  // Any failure here (missing/wrong keys, network, database) must come back as
  // a message, never a thrown error: a throw replaces the kiosk with an error page.
  let data: { log_no: number; full_name: string; time_in: string } | null = null;
  let error: unknown = null;
  try {
    const supabase = createServiceClient();
    const res = await supabase
      .from("visitors")
      .insert({
        full_name: values.full_name,
        contact_number: phone,
        address: values.address,
        purpose: values.purpose,
        purpose_details: values.purpose_details || null,
        office_to_visit: office,
        person_to_visit: values.person_to_visit || null,
        student_name: values.student_name || null,
        student_course_year: values.student_course_year || null,
      })
      .select("log_no, full_name, time_in")
      .single();
    data = res.data;
    error = res.error;
  } catch (e) {
    error = e;
  }

  if (error || !data) {
    console.error("timeIn insert failed:", error);
    return {
      status: "error",
      message: "Something went wrong saving your entry. Please try again or ask the guard.",
      fieldErrors: {},
      values,
    };
  }

  return { status: "success", logNo: data.log_no, fullName: data.full_name, timeIn: data.time_in };
}

// ---------------------------------------------------------------------------
// Time out
// ---------------------------------------------------------------------------

export type InsideMatch = {
  id: string;
  full_name: string;
  office_to_visit: string;
  time_in: string;
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Finds visitors who are still inside, by name. Never returns contact details. */
export async function searchInside(name: string): Promise<InsideMatch[]> {
  const q = String(name ?? "").trim().replace(/\s+/g, " ");
  if (q.length < 2 || q.length > 120) return [];

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("visitors")
      .select("id, full_name, office_to_visit, time_in")
      .is("time_out", null)
      .ilike("full_name", `%${escapeLike(q)}%`)
      .order("time_in", { ascending: false })
      .limit(10);

    if (error) {
      console.error("searchInside failed:", error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error("searchInside failed:", e);
    return [];
  }
}

export type TimeOutResult =
  | { ok: true; fullName: string; timeIn: string; timeOut: string }
  | { ok: false; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Times a visitor out after they confirm the last 4 digits of their contact number. */
export async function timeOut(id: string, last4: string): Promise<TimeOutResult> {
  if (!UUID_RE.test(String(id))) return { ok: false, message: "Invalid entry." };
  if (!/^\d{4}$/.test(String(last4)))
    return { ok: false, message: "Enter the last 4 digits of your contact number." };

  try {
    return await recordTimeOut(id, last4);
  } catch (e) {
    console.error("timeOut failed:", e);
    return { ok: false, message: "Could not record your time-out. Please ask the guard." };
  }
}

async function recordTimeOut(id: string, last4: string): Promise<TimeOutResult> {
  const supabase = createServiceClient();
  const { data: visitor, error } = await supabase
    .from("visitors")
    .select("id, full_name, contact_number, time_in, time_out")
    .eq("id", id)
    .maybeSingle();

  if (error || !visitor) return { ok: false, message: "Entry not found. Please ask the guard." };
  if (visitor.time_out) return { ok: false, message: "You have already timed out." };
  if (!visitor.contact_number.endsWith(last4))
    return { ok: false, message: "The digits don't match our record. Please try again." };

  const { data: updated, error: updateError } = await supabase
    .from("visitors")
    .update({ time_out: new Date().toISOString(), timed_out_by: "visitor" })
    .eq("id", id)
    .is("time_out", null) // guards against double submissions
    .select("time_out")
    .maybeSingle();

  if (updateError || !updated?.time_out) {
    console.error("timeOut failed:", updateError);
    return { ok: false, message: "Could not record your time-out. Please ask the guard." };
  }

  return {
    ok: true,
    fullName: visitor.full_name,
    timeIn: visitor.time_in,
    timeOut: updated.time_out,
  };
}
