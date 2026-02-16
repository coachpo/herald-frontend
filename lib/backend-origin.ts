function normalizeOrigin(url: string): string {
  return url.replace(/\/+$/, "");
}

export const BACKEND_ORIGIN = normalizeOrigin(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8100",
);
