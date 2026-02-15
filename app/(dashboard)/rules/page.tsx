"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch, readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Channel, IngestEndpoint, Rule } from "@/lib/types";

export default function RulesPage() {
  const auth = useAuth();
  const canCreate = Boolean(auth.user?.email_verified_at);

  const [rules, setRules] = useState<Rule[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [endpoints, setEndpoints] = useState<IngestEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [channelId, setChannelId] = useState("");
  const [endpointIds, setEndpointIds] = useState<string[]>([]);
  const [containsLines, setContainsLines] = useState("");
  const [regex, setRegex] = useState("");
  const [payloadJson, setPayloadJson] = useState('{\n  "title": "Ingest {{ingest_endpoint.name}}",\n  "body": "{{message.payload_text}}"\n}');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [rRes, cRes, eRes] = await Promise.all([
      apiFetch("/api/rules", { method: "GET", accessToken: auth.accessToken }),
      apiFetch("/api/channels", { method: "GET", accessToken: auth.accessToken }),
      apiFetch("/api/ingest-endpoints", { method: "GET", accessToken: auth.accessToken }),
    ]);
    if (!rRes.ok) {
      setError((await readApiError(rRes)).message);
      setLoading(false);
      return;
    }
    if (!cRes.ok) {
      setError((await readApiError(cRes)).message);
      setLoading(false);
      return;
    }
    if (!eRes.ok) {
      setError((await readApiError(eRes)).message);
      setLoading(false);
      return;
    }
    const rData = await readJson<{ rules: Rule[] }>(rRes);
    const cData = await readJson<{ channels: Channel[] }>(cRes);
    const eData = await readJson<{ endpoints: IngestEndpoint[] }>(eRes);
    setRules(rData.rules);
    setChannels(cData.channels);
    setEndpoints(eData.endpoints);
    setLoading(false);
  }, [auth.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!channelId && channels.length) {
      setChannelId(channels[0].id);
    }
  }, [channels, channelId]);

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [rules],
  );

  const channelNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of channels) m.set(c.id, c.name);
    return m;
  }, [channels]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Rules</div>
        <div className="mt-1 text-sm text-zinc-600">Match ingested messages and forward to a channel.</div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-semibold">Create rule</div>
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
          <label className="flex items-end gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!canCreate}
            />
            <span className="text-sm text-zinc-700">Enabled</span>
          </label>

          <label className="block">
            <div className="text-xs font-medium text-zinc-700">Channel</div>
            <select
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              disabled={!canCreate}
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-medium text-zinc-700">Ingest endpoints (optional)</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {endpoints.map((ep) => {
                const on = endpointIds.includes(ep.id);
                return (
                  <button
                    key={ep.id}
                    type="button"
                    disabled={!canCreate}
                    className={
                      "rounded-full border px-3 py-1 text-xs font-medium " +
                      (on
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50")
                    }
                    onClick={() => {
                      setEndpointIds((prev) =>
                        prev.includes(ep.id)
                          ? prev.filter((x) => x !== ep.id)
                          : [...prev, ep.id],
                      );
                    }}
                  >
                    {ep.name}
                  </button>
                );
              })}
            </div>
          </label>

          <label className="block">
            <div className="text-xs font-medium text-zinc-700">Payload contains (one per line)</div>
            <textarea
              className="mt-1 h-24 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={containsLines}
              onChange={(e) => setContainsLines(e.target.value)}
              disabled={!canCreate}
            />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-zinc-700">Payload regex (optional)</div>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              disabled={!canCreate}
            />
          </label>
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium text-zinc-700">Bark payload template (JSON)</div>
          <textarea
            className="mt-1 h-48 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 font-mono text-xs"
            value={payloadJson}
            onChange={(e) => setPayloadJson(e.target.value)}
            disabled={!canCreate}
          />
          <div className="mt-2 text-xs text-zinc-600">
            Available vars: {"{{message.payload_text}}"}, {"{{ingest_endpoint.name}}"}.
          </div>
        </div>

        <div className="mt-3">
          <button
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            disabled={!canCreate || !name.trim() || !channelId}
            onClick={async () => {
              setError(null);
              let payload: Record<string, unknown>;
              try {
                payload = JSON.parse(payloadJson) as Record<string, unknown>;
              } catch {
                setError("Payload template is not valid JSON.");
                return;
              }
              const contains = containsLines
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              const filter: Record<string, unknown> = {};
              if (endpointIds.length) filter.ingest_endpoint_ids = endpointIds;
              if (contains.length || regex.trim()) {
                filter.text = {
                  contains: contains.length ? contains : undefined,
                  regex: regex.trim() || undefined,
                };
              }

              const res = await apiFetch("/api/rules", {
                method: "POST",
                accessToken: auth.accessToken,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name,
                  enabled,
                  channel_id: channelId,
                  filter,
                  bark_payload_template: payload,
                }),
              });
              if (!res.ok) {
                const err = await readApiError(res);
                setError(err.message);
                return;
              }
              setName("");
              setEndpointIds([]);
              setContainsLines("");
              setRegex("");
              void load();
            }}
          >
            Create
          </button>
          {!canCreate && (
            <div className="mt-2 text-xs text-amber-700">Verify your email to create rules.</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold">Rules</div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-zinc-600">Loading...</div>
        ) : sortedRules.length === 0 ? (
          <div className="px-4 py-6 text-sm text-zinc-600">No rules yet.</div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {sortedRules.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-zinc-900">{r.name}</div>
                  <div className="flex items-center gap-3">
                    <div className={"text-xs font-medium " + (r.enabled ? "text-emerald-700" : "text-zinc-500")}>
                      {r.enabled ? "enabled" : "disabled"}
                    </div>
                    <button
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
                      disabled={!canCreate}
                      onClick={async () => {
                        if (!confirm("Delete this rule?")) return;
                        const res = await apiFetch(`/api/rules/${r.id}`, {
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
                </div>
                <div className="mt-1 text-xs text-zinc-600">
                  Channel: {channelNameById.get(r.channel_id) ?? r.channel_id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
