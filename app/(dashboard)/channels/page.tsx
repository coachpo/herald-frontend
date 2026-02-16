"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { readApiError, readJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { authedFetch } from "@/lib/authed";
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

type ChannelTestResp = {
  ok: boolean;
  channel_id: string;
  channel_type: ChannelType;
  provider_response: unknown;
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

function looksLikeBarkDeviceKey(seg: string): boolean {
  const s = (seg || "").trim();
  if (s.length < 16) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(s)) return false;
  return /\d/.test(s);
}

function trySplitBarkUrl(input: string): { serverBaseUrl: string; deviceKey: string } | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }

  const path = u.pathname.replace(/\/+$/, "");
  if (path === "" || path === "/") {
    return null;
  }

  if (path === "/push") {
    return null;
  }

  const segs = path.split("/").filter(Boolean);
  if (segs.length !== 1) return null;
  const seg = segs[0];
  if (!looksLikeBarkDeviceKey(seg)) return null;
  return { serverBaseUrl: u.origin, deviceKey: seg };
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
  const [barkUseDeviceKeys, setBarkUseDeviceKeys] = useState(false);
  const [barkDeviceKeysText, setBarkDeviceKeysText] = useState("");
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

  const [testChannelId, setTestChannelId] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState("Beacon Spear test");
  const [testBody, setTestBody] = useState("Test notification from Beacon Spear");
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ChannelTestResp | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await authedFetch(auth, "/api/channels", { method: "GET" });
    if (!res.ok) {
      setError((await readApiError(res)).message);
      setLoading(false);
      return;
    }
    const data = await readJson<{ channels: Channel[] }>(res);
    setItems(data.channels);
    setLoading(false);
  }, [auth]);

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
    setBarkUseDeviceKeys(false);
    setBarkDeviceKeysText("");
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

    setTestChannelId(null);
    setTestTitle("Beacon Spear test");
    setTestBody("Test notification from Beacon Spear");
    setTestLoading(false);
    setTestError(null);
    setTestResult(null);
  }, []);

  const beginEdit = useCallback(
    async (id: string) => {
      setError(null);
      setSubmitting(true);
      try {
        const res = await authedFetch(auth, `/api/channels/${id}`, { method: "GET" });
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
          const keys = Array.isArray(cfg.device_keys) ? cfg.device_keys.filter(Boolean) : [];
          if (keys.length > 0) {
            setBarkUseDeviceKeys(true);
            setBarkDeviceKeysText(keys.join("\n"));
            setBarkDeviceKey("");
          } else {
            setBarkUseDeviceKeys(false);
            setBarkDeviceKeysText("");
            setBarkDeviceKey((cfg.device_key ?? "") || "");
          }
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
    [auth],
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
        let baseUrl = barkServerBaseUrl.trim();
        let deviceKey = barkDeviceKey.trim();
        if (!baseUrl) {
          setError("Server base URL is required.");
          return;
        }

        if (baseUrl.endsWith("/push")) {
          baseUrl = baseUrl.slice(0, -"/push".length);
        }

        const split = trySplitBarkUrl(baseUrl);
        if (split) {
          baseUrl = split.serverBaseUrl;
          if (!barkUseDeviceKeys && !deviceKey) {
            deviceKey = split.deviceKey;
          }
        }

        let deviceKeys: string[] | null = null;
        if (barkUseDeviceKeys) {
          const keys = barkDeviceKeysText
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          if (keys.length === 0) {
            setError("At least one device key is required.");
            return;
          }
          deviceKeys = keys;
        } else {
          if (!deviceKey) {
            setError("Device key is required (you can also paste a full Bark key URL). ");
            return;
          }
        }

        const parsed = parseJsonObject(barkDefaultPayloadJson);
        if (!parsed.ok) {
          setError(`Default payload JSON: ${parsed.error}`);
          return;
        }
        cfg = {
          server_base_url: baseUrl,
          device_key: barkUseDeviceKeys ? undefined : deviceKey,
          device_keys: barkUseDeviceKeys ? deviceKeys : undefined,
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
      const res = await authedFetch(auth, path, {
        method,
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
    auth,
    barkDefaultPayloadJson,
    barkDeviceKey,
    barkDeviceKeysText,
    barkServerBaseUrl,
    barkUseDeviceKeys,
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

  const sendChannelTest = useCallback(
    async (id: string) => {
      setTestError(null);
      setTestLoading(true);
      try {
        const res = await authedFetch(auth, `/api/channels/${id}/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: testTitle.trim() || null, body: testBody.trim() || null }),
        });
        if (!res.ok) {
          setTestError((await readApiError(res)).message);
          setTestResult(null);
          return;
        }
        try {
          const data = await readJson<ChannelTestResp>(res);
          setTestResult(data);
        } catch {
          setTestError("Invalid response from server.");
          setTestResult(null);
        }
      } finally {
        setTestLoading(false);
      }
    },
    [auth, testBody, testTitle],
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Channels</div>
        <div className="mt-1 text-sm text-muted-foreground">Bark, ntfy, and MQTT.</div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/10">
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
                  placeholder="https://bark.example.com (or paste https://bark.example.com/<device_key>/)"
                  value={barkServerBaseUrl}
                  onChange={(e) => setBarkServerBaseUrl(e.target.value)}
                  onBlur={(e) => {
                    const split = trySplitBarkUrl(e.target.value);
                    if (!split) return;
                    setBarkServerBaseUrl(split.serverBaseUrl);
                    if (barkUseDeviceKeys) {
                      if (!barkDeviceKeysText.trim()) {
                        setBarkDeviceKeysText(split.deviceKey);
                      }
                    } else {
                      if (!barkDeviceKey.trim()) setBarkDeviceKey(split.deviceKey);
                    }
                  }}
                  disabled={!canCreate || submitting}
                />
              </label>
              <label className="flex items-end gap-2">
                <input
                  type="checkbox"
                  checked={barkUseDeviceKeys}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setBarkUseDeviceKeys(on);
                    if (!on) {
                      setBarkDeviceKeysText("");
                    }
                  }}
                  disabled={!canCreate || submitting}
                />
                <span className="text-sm text-muted-foreground">Multiple devices</span>
              </label>
              {barkUseDeviceKeys ? (
                <label className="block md:col-span-2">
                  <div className="text-xs font-medium text-muted-foreground">Device keys</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">One per line</div>
                  <textarea
                    className="mt-1 h-20 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                    value={barkDeviceKeysText}
                    onChange={(e) => setBarkDeviceKeysText(e.target.value)}
                    disabled={!canCreate || submitting}
                  />
                </label>
              ) : (
                <label className="block">
                  <div className="text-xs font-medium text-muted-foreground">Device key</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono"
                    value={barkDeviceKey}
                    onChange={(e) => setBarkDeviceKey(e.target.value)}
                    disabled={!canCreate || submitting}
                  />
                </label>
              )}
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
            <div className="mt-2 text-xs text-warning">Verify your email to create channels.</div>
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
              <div key={c.id} className="px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{c.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {c.type} · Created: {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      className="whitespace-nowrap rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      disabled={!canCreate || submitting}
                      data-testid={`channel-send-test-toggle-${c.id}`}
                      onClick={() => {
                        setTestError(null);
                        setTestResult(null);
                        setTestChannelId((cur) => (cur === c.id ? null : c.id));
                      }}
                    >
                      Send test
                    </button>
                    <button
                      type="button"
                      className="whitespace-nowrap rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      disabled={!canCreate || submitting}
                      onClick={() => {
                        void beginEdit(c.id);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="whitespace-nowrap rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      disabled={!canCreate || submitting}
                      onClick={async () => {
                        if (!confirm("Delete this channel?")) return;
                        const res = await authedFetch(auth, `/api/channels/${c.id}`, {
                          method: "DELETE",
                        });
                        if (!res.ok) {
                          setError((await readApiError(res)).message);
                          return;
                        }
                        if (editingId === c.id) resetForm();
                        if (testChannelId === c.id) setTestChannelId(null);
                        void load();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {testChannelId === c.id && (
                  <div
                    className="mt-3 rounded-xl border border-border bg-muted/40 p-3"
                    data-testid={`channel-send-test-panel-${c.id}`}
                  >
                    <div className="text-xs font-semibold text-foreground">Send test notification</div>
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <label className="block">
                        <div className="text-xs font-medium text-muted-foreground">Title (optional)</div>
                        <input
                          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                          value={testTitle}
                          onChange={(e) => setTestTitle(e.target.value)}
                          disabled={testLoading}
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <div className="text-xs font-medium text-muted-foreground">Body</div>
                        <textarea
                          className="mt-1 h-20 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm"
                          value={testBody}
                          onChange={(e) => setTestBody(e.target.value)}
                          disabled={testLoading}
                        />
                      </label>
                    </div>

                    {testError && (
                      <div className="mt-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/10">
                        {testError}
                      </div>
                    )}

                    {testResult && (
                      <div className="mt-2 rounded-xl border border-border bg-card px-3 py-2">
                        <div className="text-xs font-semibold text-foreground">
                          Result:{" "}
                          <span className={testResult.ok ? "text-success" : "text-destructive"}>
                            {testResult.ok ? "sent" : "failed"}
                          </span>
                        </div>
                        <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted px-3 py-2 text-xs text-foreground">
                          {JSON.stringify(testResult.provider_response, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        disabled={testLoading}
                        onClick={() => void sendChannelTest(c.id)}
                        data-testid={`channel-send-test-send-${c.id}`}
                      >
                        {testLoading ? "Sending..." : "Send"}
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        disabled={testLoading}
                        onClick={() => {
                          setTestChannelId(null);
                        }}
                        data-testid={`channel-send-test-close-${c.id}`}
                      >
                        Close
                      </button>
                    </div>
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
