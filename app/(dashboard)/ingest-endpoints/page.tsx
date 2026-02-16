"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { authedFetch } from "@/lib/authed";
import { buildIngestUrl } from "@/lib/public-api";
import type { IngestEndpoint } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [createdCopiedField, setCreatedCopiedField] = useState<"key" | "url" | "curl" | null>(null);
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
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {created && (
        <div className="rounded-2xl border border-success/20 bg-success/10 p-4 dark:border-success/30 dark:bg-success/10">
          <div className="text-sm font-semibold text-success">Endpoint created</div>
          <div className="mt-2 grid gap-2 text-sm">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-success">Ingest key (copy now)</div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  className={
                    createdCopiedField === "key"
                      ? "border-success/30 bg-success/20 text-success"
                      : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  }
                  onClick={async () => {
                    const ok = await copyToClipboard(created.ingest_key);
                    if (!ok) {
                      setError("Copy failed.");
                      return;
                    }
                    setCreatedCopiedField("key");
                    window.setTimeout(() => {
                      setCreatedCopiedField((prev) => (prev === "key" ? null : prev));
                    }, 1200);
                  }}
                >
                  {createdCopiedField === "key" ? "Copied" : "Copy key"}
                </Button>
              </div>
              <div className="mt-1 break-all rounded-xl border border-success/20 bg-card px-3 py-2 font-mono text-xs text-foreground">
                {created.ingest_key}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-success">Ingest URL</div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  className={
                    createdCopiedField === "url"
                      ? "border-success/30 bg-success/20 text-success"
                      : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  }
                  onClick={async () => {
                    const ok = await copyToClipboard(created.ingest_url);
                    if (!ok) {
                      setError("Copy failed.");
                      return;
                    }
                    setCreatedCopiedField("url");
                    window.setTimeout(() => {
                      setCreatedCopiedField((prev) => (prev === "url" ? null : prev));
                    }, 1200);
                  }}
                >
                  {createdCopiedField === "url" ? "Copied" : "Copy URL"}
                </Button>
              </div>
              <div className="mt-1 break-all rounded-xl border border-success/20 bg-card px-3 py-2 font-mono text-xs text-foreground">
                {created.ingest_url}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-success">curl</div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  className={
                    createdCopiedField === "curl"
                      ? "border-success/30 bg-success/20 text-success"
                      : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  }
                  onClick={async () => {
                    const curl = `curl -X POST '${created.ingest_url}' -H 'X-Beacon-Ingest-Key: ${created.ingest_key}' --data 'hello'`;
                    const ok = await copyToClipboard(curl);
                    if (!ok) {
                      setError("Copy failed.");
                      return;
                    }
                    setCreatedCopiedField("curl");
                    window.setTimeout(() => {
                      setCreatedCopiedField((prev) => (prev === "curl" ? null : prev));
                    }, 1200);
                  }}
                >
                  {createdCopiedField === "curl" ? "Copied" : "Copy curl"}
                </Button>
              </div>
              <pre className="mt-1 overflow-auto rounded-xl border border-success/20 bg-card px-3 py-2 font-mono text-xs text-foreground">
                {`curl -X POST '${created.ingest_url}' -H 'X-Beacon-Ingest-Key: ${created.ingest_key}' --data 'hello'`}
              </pre>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setCreated(null);
              setCreatedCopiedField(null);
            }}
          >
            Dismiss
          </Button>
        </div>
      )}

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">Create endpoint</div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canCreate}
            />
            <Button
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
              setCreatedCopiedField(null);
              setCreated({
                ...data,
                ingest_url: buildIngestUrl(data.endpoint.id),
              });
                setName("");
                void load();
              }}
            >
              Create
            </Button>
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
                        <Badge variant="destructive" className="ml-2 uppercase text-[10px] tracking-wide">
                          Revoked
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">URL:</span>
                      <span className="break-all rounded-lg border border-border bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
                        {ingestUrl}
                      </span>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className={
                          copiedEndpointId === ep.id
                            ? "border-success/30 bg-success/20 text-success"
                            : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                        }
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
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="xs"
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
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
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
                    </Button>
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
