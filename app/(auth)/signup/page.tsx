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
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold tracking-tight">Sign up</div>
          <div className="mt-1 text-sm text-zinc-600">
            Create an account. You will need to verify your email.
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
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
              <div className="text-xs font-medium text-zinc-700">Email</div>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <div className="text-xs font-medium text-zinc-700">Password</div>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>

            <button
              disabled={busy}
              className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              type="submit"
            >
              {busy ? "Creating..." : "Create account"}
            </button>

            <div className="text-sm">
              <Link className="text-zinc-700 underline" href="/login">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
