"use client";

import Link from "next/link";
import { useState } from "react";

import { apiFetch, readApiError } from "@/lib/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-lg font-semibold tracking-tight">Sign up</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Create an account. You will need to verify your email.
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-sm text-success dark:border-success/30 dark:bg-success/10">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/10">
              {error}
            </div>
          )}

          <form
            className="mt-5 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              setMessage(null);
              const res = await apiFetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });
              setBusy(false);
              if (!res.ok) {
                const err = await readApiError(res);
                setError(err.message);
                return;
              }
              setMessage("Check your email for a verification link.");
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>

            <button
              disabled={busy}
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              type="submit"
            >
              {busy ? "Creating..." : "Create account"}
            </button>

            <div className="text-sm">
              <Link className="text-muted-foreground underline" href="/login">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
