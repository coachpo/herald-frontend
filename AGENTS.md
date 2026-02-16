# frontend/AGENTS.md

## Project Overview

Next.js (App Router) dashboard UI.

- Calls backend via same-origin `/api/*` (Route Handler proxy to a baked backend origin).
- Health check proxied: `GET /healthz`.

## Build And Test Commands

Run these from `frontend/`.

- Install deps:
  - `pnpm install`
- Lint:
  - `pnpm lint`
- Build:
  - `pnpm build`

## Local Dev

- Start dev server:
  - `pnpm dev -p 3000`

To point at a different backend during local development, set:

- `NEXT_PUBLIC_API_URL=http://localhost:8100`

## Testing Notes

- There is no dedicated unit test runner configured in this package; use `pnpm lint` + `pnpm build` as the primary checks.
- E2E smoke can be done via Playwright MCP against a running backend.

## Security Considerations

- Do not persist refresh/access tokens anywhere except session storage (current implementation uses session storage).
- Never hardcode secrets into the frontend codebase.
