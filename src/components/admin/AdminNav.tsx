"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: <path d="M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z" />,
  },
  {
    href: "/admin/logs",
    label: "Logbook",
    icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />,
  },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              active
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_0_20px_-4px_rgb(139_92_246/0.8)]"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              {l.icon}
            </svg>
            {l.label}
          </Link>
        );
      })}
      <Link
        href="/"
        target="_blank"
        className="rounded-full px-4 py-1.5 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        Kiosk ↗
      </Link>
    </nav>
  );
}
