"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/lib/auth";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-lg font-semibold tracking-tight">Log in</div>
          <div className="mt-1 text-sm text-muted-foreground">Use your email and password.</div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200">
              {error}
            </div>
          )}

          <form
            className="mt-5 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              const err = await login(email, password);
              setBusy(false);
              if (err) {
                setError(err.message);
                return;
              }
              router.replace(nextPath);
            }}
          >
            <label className="block">
              <div className="text-xs font-medium text-muted-foreground">Email</div>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <div className="text-xs font-medium text-muted-foreground">Password</div>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button
              disabled={busy}
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              type="submit"
            >
              {busy ? "Logging in..." : "Log in"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link className="text-muted-foreground underline" href="/forgot-password">
                Forgot password
              </Link>
              <Link className="text-muted-foreground underline" href="/signup">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
