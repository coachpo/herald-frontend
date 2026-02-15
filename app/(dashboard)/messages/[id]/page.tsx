"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { apiFetch, readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Delivery, MessageDetail } from "@/lib/types";

export default function MessageDetailPage() {
  const auth = useAuth();
  const params = useParams<{ id?: string | string[] }>();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] ?? "" : "";
  const [msg, setMsg] = useState<MessageDetail | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canDelete = Boolean(auth.user?.email_verified_at);

  useEffect(() => {
    (async () => {
      if (!id) {
        setError("Missing message id.");
        setLoading(false);
        return;
      }

      if (!auth.accessToken) {
        setLoading(true);
        return;
      }

      setLoading(true);
      setError(null);
      const [mRes, dRes] = await Promise.all([
        apiFetch(`/api/messages/${id}`, { method: "GET", accessToken: auth.accessToken }),
        apiFetch(`/api/messages/${id}/deliveries`, {
          method: "GET",
          accessToken: auth.accessToken,
        }),
      ]);
      if (!mRes.ok) {
        setError((await readApiError(mRes)).message);
        setLoading(false);
        return;
      }
      if (!dRes.ok) {
        setError((await readApiError(dRes)).message);
        setLoading(false);
        return;
      }
      const mData = await readJson<{ message: MessageDetail }>(mRes);
      const dData = await readJson<{ deliveries: Delivery[] }>(dRes);
      setMsg(mData.message);
      setDeliveries(dData.deliveries);
      setLoading(false);
    })();
  }, [auth.accessToken, id]);

  if (loading) return <div className="text-sm text-zinc-600">Loading...</div>;
  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
        {error}
      </div>
    );
  }
  if (!msg) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Message</div>
        <div className="mt-1 text-sm text-zinc-600">{new Date(msg.received_at).toLocaleString()}</div>
        <div className="mt-3">
          <button
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
            disabled={!canDelete}
            onClick={async () => {
              if (!confirm("Delete this message?")) return;
              const res = await apiFetch(`/api/messages/${id}`, {
                method: "DELETE",
                accessToken: auth.accessToken,
              });
              if (!res.ok) {
                setError((await readApiError(res)).message);
                return;
              }
              window.location.href = "/messages";
            }}
          >
            Delete
          </button>
          {!canDelete && (
            <div className="mt-2 text-xs text-amber-700">Verify your email to delete messages.</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="text-xs font-medium text-zinc-700">Payload</div>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-900">
          {msg.payload_text}
        </pre>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">Metadata</div>
          <div className="mt-2 space-y-1 text-sm text-zinc-700">
            <div>Content-Type: {msg.content_type ?? "(none)"}</div>
            <div>Remote IP: {msg.remote_ip}</div>
            <div>User-Agent: {msg.user_agent ?? "(none)"}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">Query params</div>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs">
            {JSON.stringify(msg.query, null, 2)}
          </pre>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-semibold">Headers (redacted)</div>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs">
          {JSON.stringify(msg.headers, null, 2)}
        </pre>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold">Deliveries</div>
        {deliveries.length === 0 ? (
          <div className="px-4 py-6 text-sm text-zinc-600">No deliveries yet.</div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {deliveries.map((d) => (
              <div key={d.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{d.status}</div>
                  <div className="text-xs text-zinc-600">attempts {d.attempt_count}</div>
                </div>
                {d.last_error && (
                  <div className="mt-1 text-xs text-rose-700">{d.last_error}</div>
                )}
                {d.provider_response != null && (
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs">
                    {JSON.stringify(d.provider_response, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
