"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch, readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  BarkChannelConfig,
  Channel,
  MqttChannelConfig,
  NtfyChannelConfig,
} from "@/lib/types";

type ChannelType = Channel["type"];

type ChannelDetailResp = {
  channel: Channel;
  config: BarkChannelConfig | NtfyChannelConfig | MqttChannelConfig;
};

function parseJsonObject(text: string): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true, value: {} };
  try {
    const v = JSON.parse(trimmed) as unknown;
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      return { ok: false, error: "JSON must be an object." };
    }
    return { ok: true, value: v as Record<string, unknown> };
  } catch {
    return { ok: false, error: "Invalid JSON." };
  }
}

export default function ChannelsPage() {
  const auth = useAuth();
  const canCreate = Boolean(auth.user?.email_verified_at);

  const [items, setItems] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [channelType, setChannelType] = useState<ChannelType>("bark");
  const [name, setName] = useState("");

  const [barkServerBaseUrl, setBarkServerBaseUrl] = useState("");
  const [barkDeviceKey, setBarkDeviceKey] = useState("");
  const [barkDefaultPayloadJson, setBarkDefaultPayloadJson] = useState("{}");

  const [ntfyServerBaseUrl, setNtfyServerBaseUrl] = useState("");
  const [ntfyTopic, setNtfyTopic] = useState("");
  const [ntfyAuthMode, setNtfyAuthMode] = useState<"none" | "bearer" | "basic">("none");
  const [ntfyAccessToken, setNtfyAccessToken] = useState("");
  const [ntfyUsername, setNtfyUsername] = useState("");
  const [ntfyPassword, setNtfyPassword] = useState("");
  const [ntfyDefaultHeadersJson, setNtfyDefaultHeadersJson] = useState("{}");

  const [mqttBrokerHost, setMqttBrokerHost] = useState("");
  const [mqttBrokerPort, setMqttBrokerPort] = useState("1883");
  const [mqttTopic, setMqttTopic] = useState("");
  const [mqttUsername, setMqttUsername] = useState("");
  const [mqttPassword, setMqttPassword] = useState("");
  const [mqttTls, setMqttTls] = useState(false);
  const [mqttTlsInsecure, setMqttTlsInsecure] = useState(false);
  const [mqttQos, setMqttQos] = useState("0");
  const [mqttRetain, setMqttRetain] = useState(false);
  const [mqttClientId, setMqttClientId] = useState("");
  const [mqttKeepaliveSeconds, setMqttKeepaliveSeconds] = useState("60");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch("/api/channels", {
      method: "GET",
      accessToken: auth.accessToken,
    });
    if (!res.ok) {
      setError((await readApiError(res)).message);
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

  const resetForm = useCallback(() => {
    setEditingId(null);
    setSubmitting(false);
    setError(null);

    setChannelType("bark");
    setName("");

    setBarkServerBaseUrl("");
    setBarkDeviceKey("");
    setBarkDefaultPayloadJson("{}");

    setNtfyServerBaseUrl("");
    setNtfyTopic("");
    setNtfyAuthMode("none");
    setNtfyAccessToken("");
    setNtfyUsername("");
    setNtfyPassword("");
    setNtfyDefaultHeadersJson("{}");

    setMqttBrokerHost("");
    setMqttBrokerPort("1883");
    setMqttTopic("");
    setMqttUsername("");
    setMqttPassword("");
    setMqttTls(false);
    setMqttTlsInsecure(false);
    setMqttQos("0");
    setMqttRetain(false);
    setMqttClientId("");
    setMqttKeepaliveSeconds("60");
  }, []);

  const beginEdit = useCallback(
    async (id: string) => {
      setError(null);
      setSubmitting(true);
      try {
        const res = await apiFetch(`/api/channels/${id}`, {
          method: "GET",
          accessToken: auth.accessToken,
        });
        if (!res.ok) {
          setError((await readApiError(res)).message);
          return;
        }
        const data = await readJson<ChannelDetailResp>(res);
        setEditingId(id);
        setChannelType(data.channel.type);
        setName(data.channel.name ?? "");

        if (data.channel.type === "bark") {
          const cfg = data.config as BarkChannelConfig;
          setBarkServerBaseUrl(cfg.server_base_url ?? "");
          setBarkDeviceKey((cfg.device_key ?? "") || "");
          setBarkDefaultPayloadJson(JSON.stringify(cfg.default_payload_json ?? {}, null, 2));
        } else if (data.channel.type === "ntfy") {
          const cfg = data.config as NtfyChannelConfig;
          setNtfyServerBaseUrl(cfg.server_base_url ?? "");
          setNtfyTopic(cfg.topic ?? "");
          const token = (cfg.access_token ?? "") || "";
          const user = (cfg.username ?? "") || "";
          const pass = (cfg.password ?? "") || "";
          if (token.trim()) {
            setNtfyAuthMode("bearer");
          } else if (user.trim() || pass.trim()) {
            setNtfyAuthMode("basic");
          } else {
            setNtfyAuthMode("none");
          }
          setNtfyAccessToken(token);
          setNtfyUsername(user);
          setNtfyPassword(pass);
          setNtfyDefaultHeadersJson(JSON.stringify(cfg.default_headers_json ?? {}, null, 2));
        } else {
          const cfg = data.config as MqttChannelConfig;
          setMqttBrokerHost(cfg.broker_host ?? "");
          setMqttBrokerPort(String(cfg.broker_port ?? 1883));
          setMqttTopic(cfg.topic ?? "");
          setMqttUsername((cfg.username ?? "") || "");
          setMqttPassword((cfg.password ?? "") || "");
          setMqttTls(Boolean(cfg.tls));
          setMqttTlsInsecure(Boolean(cfg.tls_insecure));
          setMqttQos(String(cfg.qos ?? 0));
          setMqttRetain(Boolean(cfg.retain));
          setMqttClientId((cfg.client_id ?? "") || "");
          setMqttKeepaliveSeconds(String(cfg.keepalive_seconds ?? 60));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [auth.accessToken],
  );

  const submit = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (!name.trim()) {
        setError("Name is required.");
        return;
      }

      let cfg: Record<string, unknown> = {};

      if (channelType === "bark") {
        if (!barkServerBaseUrl.trim()) {
          setError("Server base URL is required.");
          return;
        }
        const parsed = parseJsonObject(barkDefaultPayloadJson);
        if (!parsed.ok) {
          setError(`Default payload JSON: ${parsed.error}`);
          return;
        }
        cfg = {
          server_base_url: barkServerBaseUrl.trim(),
          device_key: barkDeviceKey.trim() || undefined,
          default_payload_json: parsed.value,
        };
      } else if (channelType === "ntfy") {
        if (!ntfyServerBaseUrl.trim()) {
          setError("Server base URL is required.");
          return;
        }
        if (!ntfyTopic.trim()) {
          setError("Topic is required.");
          return;
        }
        const parsed = parseJsonObject(ntfyDefaultHeadersJson);
        if (!parsed.ok) {
          setError(`Default headers JSON: ${parsed.error}`);
          return;
        }
        const token = ntfyAccessToken.trim();
        const user = ntfyUsername.trim();
        const pass = ntfyPassword;
        if (ntfyAuthMode === "bearer" && !token) {
          setError("Access token is required for bearer auth.");
          return;
        }
        if (ntfyAuthMode === "basic" && (!user.trim() || !pass.trim())) {
          setError("Username and password are required for basic auth.");
          return;
        }
        cfg = {
          server_base_url: ntfyServerBaseUrl.trim(),
          topic: ntfyTopic.trim(),
          access_token: ntfyAuthMode === "bearer" ? token : undefined,
          username: ntfyAuthMode === "basic" ? user : undefined,
          password: ntfyAuthMode === "basic" ? pass : undefined,
          default_headers_json: parsed.value,
        };
      } else {
        if (!mqttBrokerHost.trim()) {
          setError("Broker host is required.");
          return;
        }
        if (!mqttTopic.trim()) {
          setError("Topic is required.");
          return;
        }
        const port = parseInt(mqttBrokerPort || "0", 10);
        if (!port || port < 1 || port > 65535) {
          setError("Broker port must be between 1 and 65535.");
          return;
        }
        const qos = parseInt(mqttQos || "0", 10);
        if (qos < 0 || qos > 2) {
          setError("QoS must be 0, 1, or 2.");
          return;
        }
        const keepalive = parseInt(mqttKeepaliveSeconds || "0", 10);
        if (!keepalive || keepalive < 1 || keepalive > 3600) {
          setError("Keepalive must be between 1 and 3600.");
          return;
        }
        const user = mqttUsername.trim();
        const pass = mqttPassword;
        if ((user && !pass.trim()) || (pass.trim() && !user)) {
          setError("Username and password must be set together.");
          return;
        }

        cfg = {
          broker_host: mqttBrokerHost.trim(),
          broker_port: port,
          topic: mqttTopic.trim(),
          username: user || undefined,
          password: user ? pass : undefined,
          tls: mqttTls,
          tls_insecure: mqttTlsInsecure,
          qos,
          retain: mqttRetain,
          client_id: mqttClientId.trim() || undefined,
          keepalive_seconds: keepalive,
        };
      }

      const path = editingId ? `/api/channels/${editingId}` : "/api/channels";
      const method = editingId ? "PATCH" : "POST";
      const res = await apiFetch(path, {
        method,
        accessToken: auth.accessToken,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: channelType, name, config: cfg }),
      });
      if (!res.ok) {
        setError((await readApiError(res)).message);
        return;
      }
      resetForm();
      void load();
    } finally {
      setSubmitting(false);
    }
  }, [
    auth.accessToken,
    barkDefaultPayloadJson,
    barkDeviceKey,
    barkServerBaseUrl,
    channelType,
    editingId,
    load,
    mqttBrokerHost,
    mqttBrokerPort,
    mqttClientId,
    mqttKeepaliveSeconds,
    mqttPassword,
    mqttQos,
    mqttRetain,
    mqttTls,
    mqttTlsInsecure,
    mqttTopic,
    mqttUsername,
    name,
    ntfyAccessToken,
    ntfyAuthMode,
    ntfyDefaultHeadersJson,
    ntfyPassword,
    ntfyServerBaseUrl,
    ntfyTopic,
    ntfyUsername,
    resetForm,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Channels</div>
        <div className="mt-1 text-sm text-muted-foreground">Bark, ntfy, and MQTT.</div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold">{editingId ? "Edit channel" : "Create channel"}</div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <div className="text-xs font-medium text-muted-foreground">Type</div>
            <select
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={channelType}
              onChange={(e) => setChannelType(e.target.value as ChannelType)}
              disabled={!canCreate || submitting || Boolean(editingId)}
            >
              <option value="bark">bark</option>
              <option value="ntfy">ntfy</option>
              <option value="mqtt">mqtt</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-medium text-muted-foreground">Name</div>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canCreate || submitting}
            />
          </label>

          {channelType === "bark" && (
            <>
              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Server base URL</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  placeholder="https://your-bark.example.com"
                  value={barkServerBaseUrl}
                  onChange={(e) => setBarkServerBaseUrl(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>
              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Device key (optional)</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                  value={barkDeviceKey}
                  onChange={(e) => setBarkDeviceKey(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>
              <label className="block md:col-span-2">
                <div className="text-xs font-medium text-muted-foreground">Default payload JSON</div>
                <textarea
                  className="mt-1 h-24 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs"
                  value={barkDefaultPayloadJson}
                  onChange={(e) => setBarkDefaultPayloadJson(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>
            </>
          )}

          {channelType === "ntfy" && (
            <>
              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Server base URL</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  placeholder="https://ntfy.sh"
                  value={ntfyServerBaseUrl}
                  onChange={(e) => setNtfyServerBaseUrl(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>
              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Topic</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                  placeholder="mytopic"
                  value={ntfyTopic}
                  onChange={(e) => setNtfyTopic(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Auth</div>
                <select
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  value={ntfyAuthMode}
                  onChange={(e) => setNtfyAuthMode(e.target.value as "none" | "bearer" | "basic")}
                  disabled={!canCreate || submitting}
                >
                  <option value="none">None</option>
                  <option value="bearer">Bearer token</option>
                  <option value="basic">Basic (user/pass)</option>
                </select>
              </label>

              {ntfyAuthMode === "bearer" && (
                <label className="block">
                  <div className="text-xs font-medium text-muted-foreground">Access token</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                    value={ntfyAccessToken}
                    onChange={(e) => setNtfyAccessToken(e.target.value)}
                    disabled={!canCreate || submitting}
                  />
                </label>
              )}

              {ntfyAuthMode === "basic" && (
                <>
                  <label className="block">
                    <div className="text-xs font-medium text-muted-foreground">Username</div>
                    <input
                      className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                      value={ntfyUsername}
                      onChange={(e) => setNtfyUsername(e.target.value)}
                      disabled={!canCreate || submitting}
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs font-medium text-muted-foreground">Password</div>
                    <input
                      className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                      type="password"
                      value={ntfyPassword}
                      onChange={(e) => setNtfyPassword(e.target.value)}
                      disabled={!canCreate || submitting}
                    />
                  </label>
                </>
              )}

              <label className="block md:col-span-2">
                <div className="text-xs font-medium text-muted-foreground">Default headers JSON</div>
                <textarea
                  className="mt-1 h-24 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs"
                  value={ntfyDefaultHeadersJson}
                  onChange={(e) => setNtfyDefaultHeadersJson(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>
            </>
          )}

          {channelType === "mqtt" && (
            <>
              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Broker host</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  placeholder="mqtt.example.com"
                  value={mqttBrokerHost}
                  onChange={(e) => setMqttBrokerHost(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>
              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Broker port</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                  type="number"
                  min={1}
                  max={65535}
                  value={mqttBrokerPort}
                  onChange={(e) => setMqttBrokerPort(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>
              <label className="block md:col-span-2">
                <div className="text-xs font-medium text-muted-foreground">Topic</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                  placeholder="beacon/messages"
                  value={mqttTopic}
                  onChange={(e) => setMqttTopic(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Username (optional)</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  value={mqttUsername}
                  onChange={(e) => setMqttUsername(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>
              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Password (optional)</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  type="password"
                  value={mqttPassword}
                  onChange={(e) => setMqttPassword(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>

              <label className="flex items-end gap-2">
                <input
                  type="checkbox"
                  checked={mqttTls}
                  onChange={(e) => setMqttTls(e.target.checked)}
                  disabled={!canCreate || submitting}
                />
                <span className="text-sm text-muted-foreground">TLS</span>
              </label>
              <label className="flex items-end gap-2">
                <input
                  type="checkbox"
                  checked={mqttTlsInsecure}
                  onChange={(e) => setMqttTlsInsecure(e.target.checked)}
                  disabled={!canCreate || submitting || !mqttTls}
                />
                <span className="text-sm text-muted-foreground">TLS insecure</span>
              </label>

              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">QoS</div>
                <select
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  value={mqttQos}
                  onChange={(e) => setMqttQos(e.target.value)}
                  disabled={!canCreate || submitting}
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </label>
              <label className="flex items-end gap-2">
                <input
                  type="checkbox"
                  checked={mqttRetain}
                  onChange={(e) => setMqttRetain(e.target.checked)}
                  disabled={!canCreate || submitting}
                />
                <span className="text-sm text-muted-foreground">Retain</span>
              </label>

              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Client id (optional)</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                  value={mqttClientId}
                  onChange={(e) => setMqttClientId(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>
              <label className="block">
                <div className="text-xs font-medium text-muted-foreground">Keepalive (seconds)</div>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                  type="number"
                  min={1}
                  max={3600}
                  value={mqttKeepaliveSeconds}
                  onChange={(e) => setMqttKeepaliveSeconds(e.target.value)}
                  disabled={!canCreate || submitting}
                />
              </label>
            </>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={!canCreate || submitting}
              onClick={() => void submit()}
            >
              {editingId ? "Save" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                disabled={submitting}
                onClick={() => resetForm()}
              >
                Cancel
              </button>
            )}
          </div>

          {!canCreate && (
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">Verify your email to create channels.</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Channels</div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No channels yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {sorted.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{c.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {c.type} · Created: {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                    disabled={!canCreate || submitting}
                    onClick={() => {
                      void beginEdit(c.id);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                    disabled={!canCreate || submitting}
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
                      if (editingId === c.id) resetForm();
                      void load();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
