"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { authedFetch } from "@/lib/authed";
import { buildIngestUrl } from "@/lib/public-api";
import type { IngestEndpoint } from "@/lib/types";

type CreateResp = {
  endpoint: IngestEndpoint;
  ingest_key: string;
  ingest_url: string;
};

export default function IngestEndpointsPage() {
  const auth = useAuth();
  const [items, setItems] = useState<IngestEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateResp | null>(null);
  const [copiedEndpointId, setCopiedEndpointId] = useState<string | null>(null);

  const canCreate = Boolean(auth.user?.email_verified_at);

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [items],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await authedFetch(auth, "/api/ingest-endpoints", {
      method: "GET",
    });
    if (!res.ok) {
      const err = await readApiError(res);
      setError(err.message);
      setLoading(false);
      return;
    }
    const data = await readJson<{ endpoints: IngestEndpoint[] }>(res);
    setItems(data.endpoints);
    setLoading(false);
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
    }

    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      el.style.top = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-lg font-semibold tracking-tight">Ingest endpoints</div>
          <div className="mt-1 text-sm text-muted-foreground">
            URL identifies the endpoint; the ingest key is sent in a header.
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/10">
          {error}
        </div>
      )}

      {created && (
        <div className="rounded-2xl border border-success/20 bg-success/10 p-4 dark:border-success/30 dark:bg-success/10">
          <div className="text-sm font-semibold text-success">Endpoint created</div>
          <div className="mt-2 grid gap-2 text-sm">
            <div>
              <div className="text-xs font-medium text-success">Ingest key (copy now)</div>
              <div className="mt-1 break-all rounded-xl border border-success/20 bg-card px-3 py-2 font-mono text-xs text-foreground">
                {created.ingest_key}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-success">Ingest URL</div>
              <div className="mt-1 break-all rounded-xl border border-success/20 bg-card px-3 py-2 font-mono text-xs text-foreground">
                {created.ingest_url}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-success">curl</div>
              <pre className="mt-1 overflow-auto rounded-xl border border-success/20 bg-card px-3 py-2 font-mono text-xs text-foreground">
                {`curl -X POST '${created.ingest_url}' -H 'X-Beacon-Ingest-Key: ${created.ingest_key}' --data 'hello'`}
              </pre>
            </div>
          </div>
          <button
            className="mt-3 rounded-xl border border-success/20 bg-card px-3 py-2 text-xs font-medium text-success hover:bg-success/10"
            onClick={() => setCreated(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold">Create endpoint</div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canCreate}
          />
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            disabled={!canCreate || !name.trim()}
            onClick={async () => {
              setError(null);
              const res = await authedFetch(auth, "/api/ingest-endpoints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
              });
              if (!res.ok) {
                const err = await readApiError(res);
                setError(err.message);
                return;
              }
              const data = await readJson<CreateResp>(res);
              setCreated({
                ...data,
                ingest_url: buildIngestUrl(data.endpoint.id),
              });
              setName("");
              void load();
            }}
          >
            Create
          </button>
        </div>
        {!canCreate && (
          <div className="mt-2 text-xs text-warning">Verify your email to create endpoints.</div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Endpoints</div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No endpoints yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {sorted.map((ep) => {
              const revoked = Boolean(ep.revoked_at);
              const ingestUrl = buildIngestUrl(ep.id);
              return (
                <div key={ep.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{ep.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Created: {new Date(ep.created_at).toLocaleString()} · Last used:{" "}
                      {ep.last_used_at ? new Date(ep.last_used_at).toLocaleString() : "never"}
                      {revoked && (
                        <span className="ml-2 inline-flex items-center rounded-md border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">URL:</span>
                      <span className="break-all rounded-lg border border-border bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
                        {ingestUrl}
                      </span>
                      <button
                        type="button"
                        className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium hover:bg-muted"
                        onClick={async () => {
                          const ok = await copyToClipboard(ingestUrl);
                          if (!ok) {
                            setError("Copy failed.");
                            return;
                          }
                          setCopiedEndpointId(ep.id);
                          window.setTimeout(() => {
                            setCopiedEndpointId((prev) => (prev === ep.id ? null : prev));
                          }, 1200);
                        }}
                      >
                        {copiedEndpointId === ep.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      disabled={revoked || !canCreate}
                      onClick={async () => {
                        if (!confirm("Revoke this ingest endpoint?")) return;
                        setError(null);
                        const res = await authedFetch(auth, `/api/ingest-endpoints/${ep.id}/revoke`, {
                          method: "POST",
                        });
                        if (!res.ok) {
                          const err = await readApiError(res);
                          setError(err.message);
                          return;
                        }
                        void load();
                      }}
                    >
                      Revoke
                    </button>
                    <button
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      disabled={!canCreate}
                      onClick={async () => {
                        if (!confirm("Archive this ingest endpoint? It will be hidden and will stop ingest.")) {
                          return;
                        }
                        setError(null);
                        const res = await authedFetch(auth, `/api/ingest-endpoints/${ep.id}`, {
                          method: "DELETE",
                        });
                        if (!res.ok) {
                          const err = await readApiError(res);
                          setError(err.message);
                          return;
                        }
                        void load();
                      }}
                    >
                      Archive
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
