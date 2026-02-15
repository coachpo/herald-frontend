"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch, readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { IngestEndpoint } from "@/lib/types";

type CreateResp = {
  endpoint: IngestEndpoint;
  token: string;
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
          <div className="mt-1 text-sm text-zinc-600">
            Tokens embedded in URLs; shown only once on create.
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      )}

      {created && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-900">Endpoint created</div>
          <div className="mt-2 grid gap-2 text-sm">
            <div>
              <div className="text-xs font-medium text-emerald-900/80">Token (copy now)</div>
              <div className="mt-1 break-all rounded-xl border border-emerald-200 bg-white px-3 py-2 font-mono text-xs">
                {created.token}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-900/80">Ingest URL</div>
              <div className="mt-1 break-all rounded-xl border border-emerald-200 bg-white px-3 py-2 font-mono text-xs">
                {created.ingest_url}
              </div>
            </div>
          </div>
          <button
            className="mt-3 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
            onClick={() => setCreated(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-semibold">Create endpoint</div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canCreate}
          />
          <button
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
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
          <div className="mt-2 text-xs text-amber-700">
            Verify your email to create endpoints.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold">Endpoints</div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-zinc-600">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="px-4 py-6 text-sm text-zinc-600">No endpoints yet.</div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {sorted.map((ep) => {
              const revoked = Boolean(ep.revoked_at);
              return (
                <div key={ep.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">{ep.name}</div>
                    <div className="mt-1 text-xs text-zinc-600">
                      Created: {new Date(ep.created_at).toLocaleString()} · Last used:{" "}
                      {ep.last_used_at ? new Date(ep.last_used_at).toLocaleString() : "never"}
                      {revoked ? " · Revoked" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
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
