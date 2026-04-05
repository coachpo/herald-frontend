# frontend/src/lib/AGENTS.md

## Overview

`frontend/src/lib/` is the client state and API-contract layer. Changes here affect auth, request routing, token handling, and ingest URL generation, so treat this folder as security-sensitive.

Keep helpers small, explicit, and predictable. Prefer narrow utilities over abstractions that hide auth or URL rules.

## Where to Look

- `auth.tsx` for auth state, refresh flow, token persistence, and auto-refresh scheduling.
- `api.ts` for `apiFetch()`, JSON parsing, and shared request-error helpers.
- `authed.ts` for `authedFetch()` retry-after-refresh behavior.
- `public-api.ts` for `VITE_API_URL` normalization, public API URL building, and ingest URL hex conversion.
- `types.ts` for request and response shapes these helpers must match.

## Conventions

- Keep refresh tokens in `sessionStorage` under `herald_refresh_token`.
- Keep access tokens in React state, not persistent browser storage.
- Preserve the current refresh timer rule: schedule refresh about 60 seconds before JWT expiry.
- Keep `apiFetch()` browser-facing: set `Accept: application/json`, inject `Authorization` only when an access token exists, and keep `credentials: "omit"`.
- Keep `authedFetch()` simple: one request, one refresh attempt, one retry on `401`.
- Normalize `VITE_API_URL` before use. Preserve localhost `http`, upgrade non-localhost `http` to `https`, and strip path, query, and hash.
- Convert ingest endpoint UUIDs to hex for public ingest URLs, but accept already-hex values unchanged.

## Anti-Patterns

- Never move auth tokens into `localStorage`, cookies, or any other persistent client store.
- Never bypass `apiFetch()` for authenticated requests that need shared header and origin rules.
- Never change `authedFetch()` into a loop, multi-retry helper, or silent recovery layer.
- Never weaken `VITE_API_URL` normalization by preserving path, credentials, query, or hash data.
- Never treat ingest endpoint IDs as opaque when the hex form is required for the public ingest URL.
- Never add behavior here that depends on page or component lifecycle unless it directly changes these helper contracts.
