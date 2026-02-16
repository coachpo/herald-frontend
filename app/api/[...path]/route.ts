import { BACKEND_ORIGIN } from "@/lib/backend-origin";

const FORWARDED_REQ_HEADERS = new Set([
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "user-agent",
]);

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

function buildUpstreamUrl(req: Request): string {
  const url = new URL(req.url);
  return new URL(url.pathname + url.search, BACKEND_ORIGIN).toString();
}

function filterRequestHeaders(incoming: Headers): Headers {
  const h = new Headers();
  for (const [k, v] of incoming.entries()) {
    const key = k.toLowerCase();
    if (FORWARDED_REQ_HEADERS.has(key)) {
      h.set(key, v);
    }
  }
  return h;
}

function filterResponseHeaders(incoming: Headers): Headers {
  const h = new Headers();
  for (const [k, v] of incoming.entries()) {
    const key = k.toLowerCase();
    if (STRIP_RES_HEADERS.has(key)) continue;
    h.set(key, v);
  }
  return h;
}

async function proxy(req: Request): Promise<Response> {
  const upstreamUrl = buildUpstreamUrl(req);

  const init: RequestInit = {
    method: req.method,
    headers: filterRequestHeaders(req.headers),
    redirect: "manual",
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(upstreamUrl, init);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: filterResponseHeaders(res.headers),
  });
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
