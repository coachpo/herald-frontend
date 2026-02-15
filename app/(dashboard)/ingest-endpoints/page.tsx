"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch, readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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

  const canCreate = Boolean(auth.user?.email_verified_at);

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [items],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch("/api/ingest-endpoints", {
      method: "GET",
      accessToken: auth.accessToken,
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
  }, [auth.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

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
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200">
          {error}
        </div>
      )}

      {created && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="text-sm font-semibold text-emerald-900">Endpoint created</div>
          <div className="mt-2 grid gap-2 text-sm">
            <div>
              <div className="text-xs font-medium text-emerald-900/80">Ingest key (copy now)</div>
              <div className="mt-1 break-all rounded-xl border border-emerald-200 bg-card px-3 py-2 font-mono text-xs text-foreground">
                {created.ingest_key}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-900/80">Ingest URL</div>
              <div className="mt-1 break-all rounded-xl border border-emerald-200 bg-card px-3 py-2 font-mono text-xs text-foreground">
                {created.ingest_url}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-900/80">curl</div>
              <pre className="mt-1 overflow-auto rounded-xl border border-emerald-200 bg-card px-3 py-2 font-mono text-xs text-foreground">
                {`curl -X POST '${created.ingest_url}' -H 'X-Beacon-Ingest-Key: ${created.ingest_key}' --data 'hello'`}
              </pre>
            </div>
          </div>
          <button
            className="mt-3 rounded-xl border border-emerald-200 bg-card px-3 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
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
              const res = await apiFetch("/api/ingest-endpoints", {
                method: "POST",
                accessToken: auth.accessToken,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
              });
              if (!res.ok) {
                const err = await readApiError(res);
                setError(err.message);
                return;
              }
              const data = await readJson<CreateResp>(res);
              setCreated(data);
              setName("");
              void load();
            }}
          >
            Create
          </button>
        </div>
        {!canCreate && (
          <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Verify your email to create endpoints.
          </div>
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
              return (
                <div key={ep.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{ep.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Created: {new Date(ep.created_at).toLocaleString()} · Last used:{" "}
                      {ep.last_used_at ? new Date(ep.last_used_at).toLocaleString() : "never"}
                      {revoked ? " · Revoked" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      disabled={revoked || !canCreate}
                      onClick={async () => {
                        if (!confirm("Revoke this ingest endpoint?")) return;
                        setError(null);
                        const res = await apiFetch(`/api/ingest-endpoints/${ep.id}/revoke`, {
                          method: "POST",
                          accessToken: auth.accessToken,
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
