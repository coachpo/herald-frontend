"use client";

import Link from "next/link";
import { useState } from "react";
import { useEffect } from "react";

import { apiFetch, readApiError } from "@/lib/api";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [resolvedToken, setResolvedToken] = useState<string | null>(token);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resolvedToken) return;
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) setResolvedToken(t);
  }, [resolvedToken]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold tracking-tight">Reset password</div>
          {!resolvedToken && (
            <div className="mt-4 text-sm text-zinc-700">Missing token.</div>
          )}

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

          {resolvedToken && (
            <form
              className="mt-5 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError(null);
                setMessage(null);
                const res = await apiFetch("/api/auth/reset-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: resolvedToken, new_password: password }),
                });
                setBusy(false);
                if (!res.ok) {
                  const err = await readApiError(res);
                  setError(err.message);
                  return;
                }
                setMessage("Password updated. You can log in now.");
              }}
            >
              <label className="block">
                <div className="text-xs font-medium text-zinc-700">New password</div>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <button
                disabled={busy}
                className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                type="submit"
              >
                {busy ? "Saving..." : "Set new password"}
              </button>
            </form>
          )}

          <div className="mt-5 text-sm">
            <Link className="text-zinc-700 underline" href="/login">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
