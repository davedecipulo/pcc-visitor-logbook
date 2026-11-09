"use client";

import Link from "next/link";
import type { ComponentProps, PointerEvent } from "react";

/** Moves the card's glow to follow the cursor / finger. */
function track(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--x", `${e.clientX - r.left}px`);
  el.style.setProperty("--y", `${e.clientY - r.top}px`);
}

export function SpotlightLink({ className = "", ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} onPointerMove={track} onPointerDown={track} className={`spotlight ${className}`} />;
}

export function SpotlightButton({ className = "", ...props }: ComponentProps<"button">) {
  return <button {...props} onPointerMove={track} onPointerDown={track} className={`spotlight ${className}`} />;
}
