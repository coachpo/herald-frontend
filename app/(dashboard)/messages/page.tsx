"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { authedFetch } from "@/lib/authed";
import type { IngestEndpoint, MessageSummary } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MessagesPage() {
  const auth = useAuth();

  const [items, setItems] = useState<MessageSummary[]>([]);
  const [endpoints, setEndpoints] = useState<IngestEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [filterEndpointId, setFilterEndpointId] = useState("");

  const canMutate = Boolean(auth.user?.email_verified_at);
  const [olderThanDays, setOlderThanDays] = useState(30);
  const [batchEndpointId, setBatchEndpointId] = useState("");
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (filterEndpointId) params.set("ingest_endpoint_id", filterEndpointId);

    const [mRes, eRes] = await Promise.all([
      authedFetch(auth, `/api/messages?${params.toString()}`, { method: "GET" }),
      authedFetch(auth, "/api/ingest-endpoints", { method: "GET" }),
    ]);

    if (!mRes.ok) {
      setError((await readApiError(mRes)).message);
      setLoading(false);
      return;
    }
    if (!eRes.ok) {
      setError((await readApiError(eRes)).message);
      setLoading(false);
      return;
    }

    const mData = await readJson<{ messages: MessageSummary[] }>(mRes);
    const eData = await readJson<{ endpoints: IngestEndpoint[] }>(eRes);
    setItems(mData.messages);
    setEndpoints(eData.endpoints);
    setLoading(false);
  }, [auth, q, filterEndpointId]);

  useEffect(() => {
    void load();
  }, [load]);

  const epById = useMemo(() => {
    const m = new Map<string, IngestEndpoint>();
    for (const e of endpoints) m.set(e.id, e);
    return m;
  }, [endpoints]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Messages</div>
        <div className="mt-1 text-sm text-muted-foreground">Ingested payloads are stored as plain text.</div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="messages-search">Search</Label>
            <Input
              id="messages-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="substring"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="messages-endpoint">Endpoint</Label>
            <select
              id="messages-endpoint"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={filterEndpointId}
              onChange={(e) => setFilterEndpointId(e.target.value)}
            >
              <option value="">All</option>
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold">Batch delete</div>
        <div className="mt-1 text-sm text-muted-foreground">Soft-delete messages older than N days.</div>

        {batchMessage && (
          <Alert className="mt-3 border-success/20 bg-success/10 text-success dark:border-success/30 dark:bg-success/10">
            <AlertDescription className="text-success">{batchMessage}</AlertDescription>
          </Alert>
        )}

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="batch-older">Older than (days)</Label>
            <Input
              id="batch-older"
              type="number"
              min={1}
              max={36500}
              value={olderThanDays}
              onChange={(e) => setOlderThanDays(parseInt(e.target.value || "0", 10))}
              disabled={!canMutate}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="batch-endpoint">Scope endpoint (optional)</Label>
            <select
              id="batch-endpoint"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={batchEndpointId}
              onChange={(e) => setBatchEndpointId(e.target.value)}
              disabled={!canMutate}
            >
              <option value="">All</option>
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          className="mt-3"
          disabled={!canMutate || !olderThanDays || olderThanDays < 1}
          onClick={async () => {
            setError(null);
            setBatchMessage(null);
            const body: { older_than_days: number; ingest_endpoint_id?: string | null } = {
              older_than_days: olderThanDays,
            };
            if (batchEndpointId) body.ingest_endpoint_id = batchEndpointId;
            const res = await authedFetch(auth, "/api/messages/batch-delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (!res.ok) {
              setError((await readApiError(res)).message);
              return;
            }
            const data = await readJson<{ deleted_count: number }>(res);
            setBatchMessage(`Deleted ${data.deleted_count} messages.`);
            void load();
          }}
        >
          Delete
        </Button>
        {!canMutate && (
          <div className="mt-2 text-xs text-warning">Verify your email to delete messages.</div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Recent</div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No messages yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((m) => {
              const ep = epById.get(m.ingest_endpoint_id);
              const d = m.deliveries;
              const pending = d.queued + d.sending + d.retry;
              return (
                <Link
                  key={m.id}
                  href={`/messages/${m.id}`}
                  className="block px-4 py-3 hover:bg-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {ep ? ep.name : m.ingest_endpoint_id}
                      </div>
                      <div className="mt-1 truncate text-sm text-muted-foreground">
                        {m.payload_preview}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(m.received_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <div>
                        <span className="text-success">sent {d.sent}</span> · <span className="text-destructive">failed {d.failed}</span>
                      </div>
                      <div>
                        <span className={pending > 0 ? "text-warning" : "text-muted-foreground"}>pending {pending}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
