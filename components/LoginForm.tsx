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
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold tracking-tight">Log in</div>
          <div className="mt-1 text-sm text-zinc-600">Use your email and password.</div>

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
              />
            </label>

            <button
              disabled={busy}
              className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              type="submit"
            >
              {busy ? "Logging in..." : "Log in"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link className="text-zinc-700 underline" href="/forgot-password">
                Forgot password
              </Link>
              <Link className="text-zinc-700 underline" href="/signup">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
