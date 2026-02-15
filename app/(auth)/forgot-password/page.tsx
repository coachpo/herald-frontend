"use client";

import Link from "next/link";
import { useState } from "react";

import { apiFetch, readApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-lg font-semibold tracking-tight">Forgot password</div>
          <div className="mt-1 text-sm text-muted-foreground">We will email you a reset link.</div>

          {message && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              {message}
            </div>
          )}
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
              setMessage(null);
              const res = await apiFetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              setBusy(false);
              if (!res.ok) {
                const err = await readApiError(res);
                setError(err.message);
                return;
              }
              setMessage("If that email exists, you'll receive a reset link.");
            }}
          >
            <label className="block">
              <div className="text-xs font-medium text-muted-foreground">Email</div>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              type="submit"
            >
              {busy ? "Sending..." : "Send reset link"}
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
