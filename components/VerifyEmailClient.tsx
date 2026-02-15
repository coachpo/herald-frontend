"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch, readApiError } from "@/lib/api";

export function VerifyEmailClient({ token }: { token: string | null }) {
  const [resolvedToken, setResolvedToken] = useState<string | null>(token);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resolvedToken) return;
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) setResolvedToken(t);
  }, [resolvedToken]);

  useEffect(() => {
    if (!resolvedToken) return;
    (async () => {
      const res = await apiFetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resolvedToken }),
      });
      if (!res.ok) {
        const err = await readApiError(res);
        setStatus("err");
        setError(err.message);
        return;
      }
      setStatus("ok");
    })();
  }, [resolvedToken]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold tracking-tight">Verify email</div>
          {!resolvedToken && (
            <div className="mt-4 text-sm text-zinc-700">Missing token.</div>
          )}
          {resolvedToken && status === "idle" && (
            <div className="mt-4 text-sm text-zinc-700">Verifying...</div>
          )}
          {status === "ok" && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Email verified.
            </div>
          )}
          {status === "err" && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {error ?? "Verification failed."}
            </div>
          )}
          <div className="mt-5 text-sm">
            <Link className="text-zinc-700 underline" href="/login">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
