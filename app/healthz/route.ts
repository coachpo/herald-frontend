import { BACKEND_ORIGIN } from "@/lib/backend-origin";

const STRIP_RES_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "set-cookie",
]);

function filterResponseHeaders(incoming: Headers): Headers {
  const h = new Headers();
  for (const [k, v] of incoming.entries()) {
    const key = k.toLowerCase();
    if (STRIP_RES_HEADERS.has(key)) continue;
    h.set(key, v);
  }
  return h;
}

export async function GET(): Promise<Response> {
  const res = await fetch(new URL("/healthz", BACKEND_ORIGIN), {
    redirect: "manual",
    cache: "no-store",
  });
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: filterResponseHeaders(res.headers),
  });
}
