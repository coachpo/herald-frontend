"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { authedFetch } from "@/lib/authed";
import type { Delivery, MessageDetail } from "@/lib/types";

const deliveryStatusBadgeClass: Record<Delivery["status"], string> = {
  queued: "border-border bg-card text-muted-foreground",
  sending: "border-info/20 bg-info/10 text-info",
  retry: "border-warning/20 bg-warning/10 text-warning",
  sent: "border-success/20 bg-success/10 text-success",
  failed: "border-destructive/20 bg-destructive/10 text-destructive",
};

function priorityBadgeClass(priority: number): string {
  if (priority <= 1) return "border-border bg-muted text-muted-foreground";
  if (priority === 2) return "border-info/20 bg-info/10 text-info";
  if (priority === 4) return "border-warning/20 bg-warning/10 text-warning";
  if (priority >= 5) return "border-destructive/20 bg-destructive/10 text-destructive";
  return "border-border bg-card text-foreground";
}

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
  const [wrapBody, setWrapBody] = useState(true);

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
        authedFetch(auth, `/api/messages/${id}`, { method: "GET" }),
        authedFetch(auth, `/api/messages/${id}/deliveries`, { method: "GET" }),
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
  }, [auth, id]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/10">
        {error}
      </div>
    );
  }
  if (!msg) return null;

  const extrasEntries = Object.entries(msg.extras);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Message</div>
        <div className="mt-1 text-sm text-muted-foreground">{new Date(msg.received_at).toLocaleString()}</div>
        <div className="mt-3">
          <button
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            disabled={!canDelete}
            onClick={async () => {
              if (!confirm("Delete this message?")) return;
              const res = await authedFetch(auth, `/api/messages/${id}`, {
                method: "DELETE",
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
            <div className="mt-2 text-xs text-warning">Verify your email to delete messages.</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Title</div>
            <div className="mt-1 text-sm text-foreground">{msg.title || "(none)"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Group</div>
            <div className="mt-1 text-sm text-foreground">{msg.group || "(none)"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Priority</div>
            <div className="mt-1">
              <span
                className={
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold " +
                  priorityBadgeClass(msg.priority)
                }
              >
                {msg.priority}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">URL</div>
            {msg.url ? (
              <a
                href={msg.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-sm text-primary underline"
              >
                {msg.url}
              </a>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">(none)</div>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="text-xs font-medium text-muted-foreground">Tags</div>
            {msg.tags.length === 0 ? (
              <div className="mt-1 text-sm text-muted-foreground">(none)</div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1">
                {msg.tags.map((t) => (
                  <span
                    key={`${msg.id}-${t}`}
                    className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium text-muted-foreground">Body</div>
          <button
            type="button"
            className="rounded-xl border border-border bg-card px-2 py-1 text-xs font-medium hover:bg-muted"
            onClick={() => setWrapBody((v) => !v)}
          >
            {wrapBody ? "Disable wrap" : "Enable wrap"}
          </button>
        </div>
        <pre
          className={
            "mt-2 rounded-xl border border-border bg-card p-3 font-mono text-xs " +
            (wrapBody ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre")
          }
        >
          {msg.body}
        </pre>
      </div>

      <details className="rounded-2xl border border-border bg-card p-4" open>
        <summary className="cursor-pointer text-sm font-semibold">Extras</summary>
        {extrasEntries.length === 0 ? (
          <div className="mt-2 text-sm text-muted-foreground">No extras.</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[24rem] text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-2 py-2 text-left font-medium">Key</th>
                  <th className="px-2 py-2 text-left font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {extrasEntries.map(([k, v]) => (
                  <tr key={k} className="border-b border-border">
                    <td className="px-2 py-2 font-mono text-xs text-foreground">{k}</td>
                    <td className="px-2 py-2 font-mono text-xs text-foreground">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>

      <details className="rounded-2xl border border-border bg-card p-4" open>
        <summary className="cursor-pointer text-sm font-semibold">Request metadata</summary>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted p-3">
            <div className="text-xs font-semibold text-foreground">Basic</div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div>Content-Type: {msg.content_type ?? "(none)"}</div>
              <div>Remote IP: {msg.remote_ip}</div>
              <div>User-Agent: {msg.user_agent ?? "(none)"}</div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted p-3">
            <div className="text-xs font-semibold text-foreground">Query params</div>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-border bg-card p-3 font-mono text-xs">
              {JSON.stringify(msg.query, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-muted p-3">
          <div className="text-xs font-semibold text-foreground">Headers (redacted)</div>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-border bg-card p-3 font-mono text-xs">
            {JSON.stringify(msg.headers, null, 2)}
          </pre>
        </div>
      </details>


      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Deliveries</div>
        {deliveries.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No deliveries yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {deliveries.map((d) => (
              <div key={d.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    <span
                      className={
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide " +
                        deliveryStatusBadgeClass[d.status]
                      }
                    >
                      {d.status}
                    </span>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Rule: {d.rule_name ?? d.rule_id} | Channel: {d.channel_name ?? d.channel_id}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>attempts {d.attempt_count}</div>
                    {d.next_attempt_at && <div>next: {new Date(d.next_attempt_at).toLocaleString()}</div>}
                    {d.sent_at && <div>sent: {new Date(d.sent_at).toLocaleString()}</div>}
                  </div>
                </div>
                {d.last_error && (
                  <div className="mt-1 text-xs text-destructive">{d.last_error}</div>
                )}
                {d.provider_response != null && (
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-border bg-muted p-3 font-mono text-xs">
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
