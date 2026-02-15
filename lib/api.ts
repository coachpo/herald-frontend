import type { ApiError } from "@/lib/types";

export async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function readApiError(res: Response): Promise<ApiError> {
  try {
    const data = await readJson<ApiError>(res);
    if (data && typeof data.code === "string" && typeof data.message === "string") {
      return data;
    }
  } catch {
  }
  return { code: "http_error", message: `HTTP ${res.status}` };
}

export async function apiFetch(
  path: string,
  init: RequestInit & { accessToken?: string | null } = {},
) {
  const { accessToken, headers, ...rest } = init;
  const h = new Headers(headers);
  if (accessToken) {
    h.set("Authorization", `Bearer ${accessToken}`);
  }
  h.set("Accept", "application/json");

  return fetch(path, {
    ...rest,
    headers: h,
    credentials: "omit",
  });
}
