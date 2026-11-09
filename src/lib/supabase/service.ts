import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * Privileged client (bypasses RLS). Used ONLY by the kiosk server actions,
 * which validate every input themselves. Never import this from a client
 * component; the "server-only" import above makes that a build error.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing environment variable SUPABASE_SECRET_KEY. Copy .env.example to .env.local and fill it in.",
    );
  }
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
