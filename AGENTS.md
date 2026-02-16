# frontend/AGENTS.md

## Project Overview

Next.js (App Router) dashboard UI.

- Calls the backend API directly from the browser using `NEXT_PUBLIC_API_URL`.
- Health check: `GET /healthz` (frontend server only; does not proxy backend).

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
