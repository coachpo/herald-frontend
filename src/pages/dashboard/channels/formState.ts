import { useCallback, useState } from "react";

import type {
  BarkChannelConfig,
  Channel,
  GotifyChannelConfig,
  MqttChannelConfig,
  NtfyChannelConfig,
} from "@/lib/types";

import { validateBarkConfig } from "./BarkChannelForm";
import { validateGotifyConfig } from "./GotifyChannelForm";
import { validateMqttConfig } from "./MqttChannelForm";
import { validateNtfyConfig } from "./NtfyChannelForm";

export type ChannelType = Channel["type"];

export interface ChannelDetailResp {
  channel: Channel;
  config: BarkChannelConfig | NtfyChannelConfig | MqttChannelConfig | GotifyChannelConfig;
}

export function useChannelFormState() {
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

  const [gotifyServerBaseUrl, setGotifyServerBaseUrl] = useState("");
  const [gotifyAppToken, setGotifyAppToken] = useState("");
  const [gotifyDefaultPriority, setGotifyDefaultPriority] = useState("");
  const [gotifyDefaultExtrasJson, setGotifyDefaultExtrasJson] = useState("{}");

  const resetForm = useCallback(() => {
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

    setGotifyServerBaseUrl("");
    setGotifyAppToken("");
    setGotifyDefaultPriority("");
    setGotifyDefaultExtrasJson("{}");
  }, []);

  const applyDetail = useCallback((data: ChannelDetailResp) => {
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
      return;
    }

    if (data.channel.type === "ntfy") {
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
      return;
    }

    if (data.channel.type === "mqtt") {
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
      return;
    }

    const cfg = data.config as GotifyChannelConfig;
    setGotifyServerBaseUrl(cfg.server_base_url ?? "");
    setGotifyAppToken(cfg.app_token ?? "");
    setGotifyDefaultPriority(cfg.default_priority != null ? String(cfg.default_priority) : "");
    setGotifyDefaultExtrasJson(JSON.stringify(cfg.default_extras_json ?? {}, null, 2));
  }, []);

  return {
    channelType,
    setChannelType,
    name,
    setName,
    barkServerBaseUrl,
    setBarkServerBaseUrl,
    barkDeviceKey,
    setBarkDeviceKey,
    barkUseDeviceKeys,
    setBarkUseDeviceKeys,
    barkDeviceKeysText,
    setBarkDeviceKeysText,
    barkDefaultPayloadJson,
    setBarkDefaultPayloadJson,
    ntfyServerBaseUrl,
    setNtfyServerBaseUrl,
    ntfyTopic,
    setNtfyTopic,
    ntfyAuthMode,
    setNtfyAuthMode,
    ntfyAccessToken,
    setNtfyAccessToken,
    ntfyUsername,
    setNtfyUsername,
    ntfyPassword,
    setNtfyPassword,
    ntfyDefaultHeadersJson,
    setNtfyDefaultHeadersJson,
    mqttBrokerHost,
    setMqttBrokerHost,
    mqttBrokerPort,
    setMqttBrokerPort,
    mqttTopic,
    setMqttTopic,
    mqttUsername,
    setMqttUsername,
    mqttPassword,
    setMqttPassword,
    mqttTls,
    setMqttTls,
    mqttTlsInsecure,
    setMqttTlsInsecure,
    mqttQos,
    setMqttQos,
    mqttRetain,
    setMqttRetain,
    mqttClientId,
    setMqttClientId,
    mqttKeepaliveSeconds,
    setMqttKeepaliveSeconds,
    gotifyServerBaseUrl,
    setGotifyServerBaseUrl,
    gotifyAppToken,
    setGotifyAppToken,
    gotifyDefaultPriority,
    setGotifyDefaultPriority,
    gotifyDefaultExtrasJson,
    setGotifyDefaultExtrasJson,
    resetForm,
    applyDetail,
  };
}

export type ChannelFormState = ReturnType<typeof useChannelFormState>;

export function buildChannelConfig(
  form: ChannelFormState,
): { ok: true; config: Record<string, unknown> } | { ok: false; error: string } {
  if (form.channelType === "bark") {
    return validateBarkConfig({
      serverBaseUrl: form.barkServerBaseUrl,
      deviceKey: form.barkDeviceKey,
      useDeviceKeys: form.barkUseDeviceKeys,
      deviceKeysText: form.barkDeviceKeysText,
      defaultPayloadJson: form.barkDefaultPayloadJson,
    });
  }

  if (form.channelType === "ntfy") {
    return validateNtfyConfig({
      serverBaseUrl: form.ntfyServerBaseUrl,
      topic: form.ntfyTopic,
      authMode: form.ntfyAuthMode,
      accessToken: form.ntfyAccessToken,
      username: form.ntfyUsername,
      password: form.ntfyPassword,
      defaultHeadersJson: form.ntfyDefaultHeadersJson,
    });
  }

  if (form.channelType === "mqtt") {
    return validateMqttConfig({
      brokerHost: form.mqttBrokerHost,
      brokerPort: form.mqttBrokerPort,
      topic: form.mqttTopic,
      username: form.mqttUsername,
      password: form.mqttPassword,
      tls: form.mqttTls,
      tlsInsecure: form.mqttTlsInsecure,
      qos: form.mqttQos,
      retain: form.mqttRetain,
      clientId: form.mqttClientId,
      keepaliveSeconds: form.mqttKeepaliveSeconds,
    });
  }

  return validateGotifyConfig({
    serverBaseUrl: form.gotifyServerBaseUrl,
    appToken: form.gotifyAppToken,
    defaultPriority: form.gotifyDefaultPriority,
    defaultExtrasJson: form.gotifyDefaultExtrasJson,
  });
}
