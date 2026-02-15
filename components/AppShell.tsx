"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/messages", label: "Messages" },
  { href: "/ingest-endpoints", label: "Ingest endpoints" },
  { href: "/channels", label: "Channels" },
  { href: "/rules", label: "Rules" },
  { href: "/account", label: "Account" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <div className="text-sm font-semibold tracking-tight">Beacon Spear</div>
            <div className="text-xs text-zinc-500">Ingest, store, forward.</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-zinc-600">{user?.email}</div>
            <button
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50"
              onClick={() => void logout()}
            >
              Log out
            </button>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          <nav className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <ul className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={
                        "block rounded-xl px-3 py-2 text-sm transition-colors " +
                        (active
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-700 hover:bg-zinc-50")
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <main className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
