"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSessionClient, getAdminUser } from "@/lib/supabase/server";

export type LoginState = { error?: string; email?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password.", email };

  if (!(await getAdminUser())) {
    await supabase.auth.signOut();
    return { error: "This account is not authorized to access the admin dashboard.", email };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Lets staff time out a visitor who forgot to do it at the kiosk. */
export async function forceTimeOut(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;

  if (!(await getAdminUser())) redirect("/admin/login");

  // Runs as the logged-in admin, so RLS (is_admin()) is enforced by Postgres.
  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("visitors")
    .update({ time_out: new Date().toISOString(), timed_out_by: "admin" })
    .eq("id", id)
    .is("time_out", null);

  if (error) console.error("forceTimeOut failed:", error);

  revalidatePath("/admin");
  revalidatePath("/admin/logs");
}
