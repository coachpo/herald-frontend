"use client";

import { useState } from "react";

import { apiFetch, readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AccountPage() {
  const auth = useAuth();
  const user = auth.user;
  const verified = Boolean(user?.email_verified_at);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function callNoBody(path: string) {
    setError(null);
    setMessage(null);
    const res = await apiFetch(path, { method: "POST", accessToken: auth.accessToken });
    if (!res.ok) {
      const err = await readApiError(res);
      setError(err.message);
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Account</div>
        <div className="mt-1 text-sm text-zinc-600">Profile and security settings.</div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-semibold">Profile</div>
        <div className="mt-2 text-sm text-zinc-700">Email: {user?.email}</div>
        <div className="mt-1 text-sm text-zinc-700">
          Status: {verified ? "verified" : "unverified"}
        </div>
        {!verified && (
          <button
            className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            onClick={async () => {
              const ok = await callNoBody("/api/auth/resend-verification");
              if (ok) setMessage("Verification email sent (if allowed). Check your inbox.");
            }}
          >
            Resend verification email
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-semibold">Change email</div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            type="email"
            placeholder="new email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            disabled={!newEmail.trim()}
            onClick={async () => {
              setError(null);
              setMessage(null);
              const res = await apiFetch("/api/auth/change-email", {
                method: "POST",
                accessToken: auth.accessToken,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_email: newEmail }),
              });
              if (!res.ok) {
                setError((await readApiError(res)).message);
                return;
              }
              const data = await readJson<{ user: { email: string } }>(res);
              setMessage(`Email updated to ${data.user.email}. Verification required again.`);
              setNewEmail("");
              await auth.refresh();
            }}
          >
            Change
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-semibold">Change password</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            type="password"
            placeholder="old password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <input
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            type="password"
            placeholder="new password (min 8)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
          />
        </div>
        <button
          className="mt-3 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          disabled={!oldPassword || newPassword.length < 8}
          onClick={async () => {
            setError(null);
            setMessage(null);
            const res = await apiFetch("/api/auth/change-password", {
              method: "POST",
              accessToken: auth.accessToken,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
            });
            if (!res.ok) {
              setError((await readApiError(res)).message);
              return;
            }
            setOldPassword("");
            setNewPassword("");
            setMessage("Password updated.");
          }}
        >
          Change password
        </button>
      </div>
    </div>
  );
}
