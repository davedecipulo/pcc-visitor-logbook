"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Sends the kiosk back to the home screen after `ms` of no interaction,
 * so a half-filled form is never left on screen for the next visitor.
 */
export function useIdleReturn(ms: number, enabled = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    let timer = setTimeout(() => router.replace("/"), ms);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.replace("/"), ms);
    };
    const events = ["pointerdown", "keydown", "input", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [ms, enabled, router]);
}
