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

  const [testRuleId, setTestRuleId] = useState<string | null>(null);
  const [testEndpointId, setTestEndpointId] = useState("");
  const [testContentType, setTestContentType] = useState("");
  const [testPayloadText, setTestPayloadText] = useState("Hello from rule test");
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    matches: boolean;
    channel_type: string;
    rendered_payload: unknown;
  } | null>(null);

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

  const channelTypeById = useMemo(() => {
    const m = new Map<string, Channel["type"]>();
    for (const c of channels) m.set(c.id, c.type);
    return m;
  }, [channels]);

  const selectedChannelType = channelTypeById.get(channelId) ?? null;
  const payloadLabel =
    selectedChannelType === "bark"
      ? "Bark payload template (JSON)"
      : selectedChannelType === "ntfy"
        ? "ntfy payload template (JSON)"
        : selectedChannelType === "mqtt"
          ? "MQTT payload template (JSON)"
          : "Payload template (JSON)";

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Rules</div>
        <div className="mt-1 text-sm text-muted-foreground">Match ingested messages and forward to a channel.</div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold">Create rule</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <div className="text-xs font-medium text-muted-foreground">Name</div>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
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
            <span className="text-sm text-muted-foreground">Enabled</span>
          </label>

          <label className="block">
            <div className="text-xs font-medium text-muted-foreground">Channel</div>
            <select
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              disabled={!canCreate}
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-medium text-muted-foreground">Ingest endpoints (optional)</div>
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
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted")
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
            <div className="text-xs font-medium text-muted-foreground">Payload contains (one per line)</div>
            <textarea
              className="mt-1 h-24 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={containsLines}
              onChange={(e) => setContainsLines(e.target.value)}
              disabled={!canCreate}
            />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-muted-foreground">Payload regex (optional)</div>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              disabled={!canCreate}
            />
          </label>
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium text-muted-foreground">{payloadLabel}</div>
          <textarea
            className="mt-1 h-48 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs"
            value={payloadJson}
            onChange={(e) => setPayloadJson(e.target.value)}
            disabled={!canCreate}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            Available vars: {"{{message.payload_text}}"}, {"{{ingest_endpoint.name}}"}.
          </div>
        </div>

        <div className="mt-3">
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
                  payload_template: payload,
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
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">Verify your email to create rules.</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Rules</div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Loading...</div>
        ) : sortedRules.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No rules yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {sortedRules.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                  <div className="flex items-center gap-3">
                    <div className={"text-xs font-medium " + (r.enabled ? "text-emerald-700" : "text-muted-foreground")}>
                      {r.enabled ? "enabled" : "disabled"}
                    </div>
                    <button
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      disabled={!canCreate || endpoints.length === 0}
                      onClick={() => {
                        setTestError(null);
                        setTestResult(null);
                        setTestRuleId((prev) => (prev === r.id ? null : r.id));
                        if (!testEndpointId && endpoints.length) {
                          setTestEndpointId(endpoints[0].id);
                        }
                      }}
                    >
                      Test
                    </button>
                    <button
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
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
                <div className="mt-1 text-xs text-muted-foreground">
                  Channel: {channelNameById.get(r.channel_id) ?? r.channel_id}
                </div>

                {testRuleId === r.id && (
                  <div className="mt-3 rounded-xl border border-border bg-card p-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="block">
                        <div className="text-xs font-medium text-muted-foreground">Ingest endpoint</div>
                        <select
                          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                          value={testEndpointId}
                          onChange={(e) => setTestEndpointId(e.target.value)}
                          disabled={!canCreate || testLoading}
                        >
                          {endpoints.map((ep) => (
                            <option key={ep.id} value={ep.id}>
                              {ep.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <div className="text-xs font-medium text-muted-foreground">Content-Type (optional)</div>
                        <input
                          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                          value={testContentType}
                          onChange={(e) => setTestContentType(e.target.value)}
                          disabled={!canCreate || testLoading}
                          placeholder="text/plain"
                        />
                      </label>
                    </div>

                    <label className="mt-3 block">
                      <div className="text-xs font-medium text-muted-foreground">Payload text</div>
                      <textarea
                        className="mt-1 h-24 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                        value={testPayloadText}
                        onChange={(e) => setTestPayloadText(e.target.value)}
                        disabled={!canCreate || testLoading}
                      />
                    </label>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        disabled={!canCreate || !testEndpointId || testLoading}
                        onClick={async () => {
                          setTestError(null);
                          setTestResult(null);
                          setTestLoading(true);
                          try {
                            const res = await apiFetch(`/api/rules/${r.id}/test`, {
                              method: "POST",
                              accessToken: auth.accessToken,
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                ingest_endpoint_id: testEndpointId,
                                content_type: testContentType.trim() || null,
                                payload_text: testPayloadText,
                              }),
                            });
                            if (!res.ok) {
                              setTestError((await readApiError(res)).message);
                              return;
                            }
                            const data = await readJson<{
                              matches: boolean;
                              channel_type: string;
                              rendered_payload: unknown;
                            }>(res);
                            setTestResult(data);
                          } finally {
                            setTestLoading(false);
                          }
                        }}
                      >
                        Run test
                      </button>
                      <button
                        className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
                        type="button"
                        onClick={() => {
                          setTestRuleId(null);
                          setTestError(null);
                          setTestResult(null);
                        }}
                      >
                        Close
                      </button>
                    </div>

                    {testError && (
                      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200">
                        {testError}
                      </div>
                    )}

                    {testResult && (
                      <div className="mt-3 grid gap-2">
                        <div className="text-xs text-muted-foreground">
                          Matches: {testResult.matches ? "true" : "false"} · Channel type: {testResult.channel_type}
                        </div>
                        <pre className="overflow-auto rounded-xl border border-border bg-muted p-3 text-xs">
                          {JSON.stringify(testResult.rendered_payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
