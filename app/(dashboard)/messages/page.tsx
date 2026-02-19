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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function priorityBadgeClass(priority: number): string {
  if (priority <= 1) return "border-border bg-muted text-muted-foreground";
  if (priority === 2) return "border-info/20 bg-info/10 text-info";
  if (priority === 4) return "border-warning/20 bg-warning/10 text-warning";
  if (priority >= 5) return "border-destructive/20 bg-destructive/10 text-destructive";
  return "border-border bg-card text-foreground";
}

export default function MessagesPage() {
  const auth = useAuth();

  const [items, setItems] = useState<MessageSummary[]>([]);
  const [endpoints, setEndpoints] = useState<IngestEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [filterEndpointId, setFilterEndpointId] = useState("");
  const [group, setGroup] = useState("");
  const [priorityMin, setPriorityMin] = useState("");
  const [priorityMax, setPriorityMax] = useState("");
  const [tag, setTag] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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
    if (group.trim()) params.set("group", group.trim());
    if (priorityMin) params.set("priority_min", priorityMin);
    if (priorityMax) params.set("priority_max", priorityMax);
    if (tag.trim()) params.set("tag", tag.trim());
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

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
  }, [auth, filterEndpointId, fromDate, group, priorityMax, priorityMin, q, tag, toDate]);

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
        <div className="mt-1 text-sm text-muted-foreground">
          Browse structured ingested messages and delivery status.
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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

          <div className="space-y-2">
            <Label htmlFor="messages-group">Group</Label>
            <Input
              id="messages-group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="deploys"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="messages-priority-min">Priority min</Label>
            <select
              id="messages-priority-min"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={priorityMin}
              onChange={(e) => setPriorityMin(e.target.value)}
            >
              <option value="">Any</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="messages-priority-max">Priority max</Label>
            <select
              id="messages-priority-max"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={priorityMax}
              onChange={(e) => setPriorityMax(e.target.value)}
            >
              <option value="">Any</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="messages-tag">Tag</Label>
            <Input
              id="messages-tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="production"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="messages-from">From</Label>
            <Input
              id="messages-from"
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="messages-to">To</Label>
            <Input
              id="messages-to"
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Title / Body</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Deliveries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((m) => {
                const ep = epById.get(m.ingest_endpoint_id);
                const d = m.deliveries;
                const pending = d.queued + d.sending + d.retry;
                const titleOrPreview = (m.title || "").trim() || m.body_preview;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-normal text-xs text-muted-foreground">
                      {new Date(m.received_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-normal text-xs text-muted-foreground">
                      {ep ? ep.name : m.ingest_endpoint_id}
                    </TableCell>
                    <TableCell className="max-w-[24rem] whitespace-normal">
                      <Link href={`/messages/${m.id}`} className="text-sm font-medium text-foreground hover:underline">
                        {titleOrPreview}
                      </Link>
                      {m.title && (
                        <div className="mt-1 text-xs text-muted-foreground">{m.body_preview}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold " +
                          priorityBadgeClass(m.priority)
                        }
                      >
                        {m.priority}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[14rem] whitespace-normal">
                      {m.tags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">-</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.tags.map((t) => (
                            <span
                              key={`${m.id}-${t}`}
                              className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal text-xs text-muted-foreground">
                      {m.group || "-"}
                    </TableCell>
                    <TableCell className="whitespace-normal text-xs text-muted-foreground">
                      <span className="text-success">sent {d.sent}</span> ·{" "}
                      <span className="text-destructive">failed {d.failed}</span> ·{" "}
                      <span className={pending > 0 ? "text-warning" : "text-muted-foreground"}>pending {pending}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
