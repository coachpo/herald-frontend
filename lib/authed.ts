import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/types";

export type AuthLike = {
  accessToken: string | null;
  refresh: () => Promise<string | null>;
};

export async function authedFetch(
  auth: AuthLike,
  path: string,
  init: RequestInit = {},
) {
  const res1 = await apiFetch(path, { ...init, accessToken: auth.accessToken });
  if (res1.status !== 401) return res1;
  const tok = await auth.refresh();
  return apiFetch(path, { ...init, accessToken: tok });
}

export function formatApiError(e: ApiError): string {
  return e.details ? `${e.message}` : e.message;
}
