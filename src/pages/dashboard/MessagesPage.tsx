import { Link } from "react-router";
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
  }, [auth, q, filterEndpointId, group, priorityMin, priorityMax, tag, fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const endpointNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ep of endpoints) map.set(ep.id, ep.name);
    return map;
  }, [endpoints]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Messages</div>
        <div className="mt-1 text-sm text-muted-foreground">All ingested messages.</div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold">Filters</div>
        <form
          className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="msg-q">Search</Label>
            <Input id="msg-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="body text" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="msg-ep">Endpoint</Label>
            <select
              id="msg-ep"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={filterEndpointId}
              onChange={(e) => setFilterEndpointId(e.target.value)}
            >
              <option value="">All</option>
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>{ep.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="msg-group">Group</Label>
            <Input id="msg-group" value={group} onChange={(e) => setGroup(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="msg-pmin">Priority min</Label>
            <Input id="msg-pmin" type="number" value={priorityMin} onChange={(e) => setPriorityMin(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="msg-pmax">Priority max</Label>
            <Input id="msg-pmax" type="number" value={priorityMax} onChange={(e) => setPriorityMax(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="msg-tag">Tag</Label>
            <Input id="msg-tag" value={tag} onChange={(e) => setTag(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="msg-from">From</Label>
            <Input id="msg-from" type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="msg-to">To</Label>
            <Input id="msg-to" type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Search</Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold">Batch delete</div>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="batch-days">Older than (days)</Label>
            <Input
              id="batch-days"
              type="number"
              className="w-24"
              value={olderThanDays}
              onChange={(e) => setOlderThanDays(Number(e.target.value))}
              min={1}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="batch-ep">Endpoint (optional)</Label>
            <select
              id="batch-ep"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={batchEndpointId}
              onChange={(e) => setBatchEndpointId(e.target.value)}
            >
              <option value="">All endpoints</option>
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>{ep.name}</option>
              ))}
            </select>
          </div>
          <Button
            variant="destructive"
            disabled={!canMutate}
            onClick={async () => {
              if (!confirm(`Delete messages older than ${olderThanDays} days?`)) return;
              setBatchMessage(null);
              const body: Record<string, unknown> = { older_than_days: olderThanDays };
              if (batchEndpointId) body.ingest_endpoint_id = batchEndpointId;
              const res = await authedFetch(auth, "/api/messages/batch-delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
              if (!res.ok) {
                setBatchMessage((await readApiError(res)).message);
                return;
              }
              const data = await readJson<{ deleted_count: number }>(res);
              setBatchMessage(`Deleted ${data.deleted_count} message(s).`);
              void load();
            }}
          >
            Delete
          </Button>
        </div>
        {batchMessage && (
          <div className="mt-2 text-sm text-muted-foreground">{batchMessage}</div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No messages found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
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
                const d = m.deliveries;
                const pending = d.queued + d.sending + d.retry;
                const titleOrPreview = (m.title || "").trim() || m.body_preview;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-normal text-xs text-muted-foreground">
                      {new Date(m.received_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-normal text-xs text-muted-foreground">
                      {endpointNameById.get(m.ingest_endpoint_id) ?? m.ingest_endpoint_id}
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate">
                      <Link
                        to={`/messages/${m.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {titleOrPreview}
                      </Link>
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
