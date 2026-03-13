import type { Channel, Rule } from "@/lib/types";

export function parseJsonObject(
  text: string,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "JSON is required." };
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

export interface RuleTestMatch {
  rule: Rule;
  channel: Channel;
  channel_type: string;
  rendered_payload: unknown;
}

export interface RuleTestResult {
  matched_count: number;
  total_rules: number;
  matches: RuleTestMatch[];
}
