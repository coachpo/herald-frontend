"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch, readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { BarkChannelConfig, Channel } from "@/lib/types";

export default function ChannelsPage() {
  const auth = useAuth();
  const [items, setItems] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [serverBaseUrl, setServerBaseUrl] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [defaultJson, setDefaultJson] = useState("{}");

  const canCreate = Boolean(auth.user?.email_verified_at);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch("/api/channels", {
      method: "GET",
      accessToken: auth.accessToken,
    });
    if (!res.ok) {
      const err = await readApiError(res);
      setError(err.message);
      setLoading(false);
      return;
    }
    const data = await readJson<{ channels: Channel[] }>(res);
    setItems(data.channels);
    setLoading(false);
  }, [auth.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [items],
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Channels</div>
        <div className="mt-1 text-sm text-zinc-600">Bark v2 only in v0.1.</div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-semibold">Create Bark channel</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <div className="text-xs font-medium text-zinc-700">Name</div>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canCreate}
            />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-zinc-700">Server base URL</div>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              placeholder="https://your-bark.example.com"
              value={serverBaseUrl}
              onChange={(e) => setServerBaseUrl(e.target.value)}
              disabled={!canCreate}
            />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-zinc-700">Device key</div>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono"
              value={deviceKey}
              onChange={(e) => setDeviceKey(e.target.value)}
              disabled={!canCreate}
            />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-zinc-700">Default payload JSON</div>
            <textarea
              className="mt-1 h-24 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 font-mono text-xs"
              value={defaultJson}
              onChange={(e) => setDefaultJson(e.target.value)}
              disabled={!canCreate}
            />
          </label>
        </div>

        <div className="mt-3">
          <button
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            disabled={!canCreate || !name.trim() || !serverBaseUrl.trim()}
            onClick={async () => {
              setError(null);
              let parsed: Record<string, unknown> = {};
              try {
                parsed = defaultJson.trim() ? (JSON.parse(defaultJson) as Record<string, unknown>) : {};
              } catch {
                setError("Default payload JSON is not valid JSON.");
                return;
              }
              const cfg: BarkChannelConfig = {
                server_base_url: serverBaseUrl.trim(),
                device_key: deviceKey.trim() || undefined,
                default_payload_json: parsed,
              };
              const res = await apiFetch("/api/channels", {
                method: "POST",
                accessToken: auth.accessToken,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "bark", name, config: cfg }),
              });
              if (!res.ok) {
                const err = await readApiError(res);
                setError(err.message);
                return;
              }
              setName("");
              setServerBaseUrl("");
              setDeviceKey("");
              setDefaultJson("{}");
              void load();
            }}
          >
            Create
          </button>
          {!canCreate && (
            <div className="mt-2 text-xs text-amber-700">
              Verify your email to create channels.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold">Channels</div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-zinc-600">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="px-4 py-6 text-sm text-zinc-600">No channels yet.</div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {sorted.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-zinc-900">{c.name}</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    {c.type} · Created: {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
                  disabled={!canCreate}
                  onClick={async () => {
                    if (!confirm("Delete this channel?")) return;
                    const res = await apiFetch(`/api/channels/${c.id}`, {
                      method: "DELETE",
                      accessToken: auth.accessToken,
                    });
                    if (!res.ok) {
                      setError((await readApiError(res)).message);
                      return;
                    }
                    void load();
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
