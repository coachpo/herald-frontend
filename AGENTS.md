# frontend/AGENTS.md

## Overview

React 19 + Vite + React Router dashboard. Production requests go directly from the browser to the backend via `VITE_API_URL`; Vite's proxy is a local-dev convenience only.

## Commands

```bash
pnpm install
pnpm lint
pnpm build
pnpm dev
```

## Structure

```text
frontend/
├── src/
│   ├── components/   # AppShell, AuthGate, forms, shadcn/ui primitives
│   ├── layouts/      # AuthLayout, DashboardLayout
│   ├── lib/          # api/auth/authed/public-api/types/utils
│   ├── pages/        # auth pages + dashboard pages
│   ├── router.tsx    # route tree
│   ├── main.tsx      # BrowserRouter bootstrap
│   └── globals.css   # Tailwind v4 tokens + theme styles
├── vite.config.ts    # port 3000, local proxy, path alias
├── components.json   # shadcn/ui registry config
└── deploy/server.mjs # static file server for Docker image
```

## Route Map

```text
/login /signup /forgot-password /reset-password /verify-email
/ /messages /messages/:id /channels /rules /ingest-endpoints /account
```

## Key Patterns

- `AuthLayout` and `DashboardLayout` both provide `AuthProvider`.
- `AuthGate` triggers an immediate refresh on mount and redirects unauthenticated users to `/login?next=...`.
- Refresh token lives in `sessionStorage`; access token stays in React state.
- JWT auto-refresh is scheduled 60 seconds before expiry.
- `apiFetch()` injects `Authorization` and always uses `credentials: "omit"`.
- `authedFetch()` retries once after a successful refresh on `401`.
- `buildPublicApiUrl()` normalizes non-localhost HTTP origins to HTTPS.
- Forms use `useState` plus manual validation; there is no active frontend test runner.
- Theme preference uses `localStorage` key `herald_theme` and `<html data-theme>`.

## UI Notes

- Dashboard home shows quick actions, recent messages, recent failures, and a getting-started list.
- Messages page provides filters plus batch delete.
- Channels page supports Bark, ntfy, MQTT, and Gotify CRUD plus live send-test calls.
- Rules page supports filter editing, payload template JSON, and no-send test previews.
- Ingest endpoints page shows the key once at creation and provides copyable URL/curl examples.

## Security (Do Not)

- Never store auth tokens in `localStorage`.
- Never hardcode secrets into frontend code or config.
- Never render ingested payloads as HTML.
- Never assume a form helper library is the active pattern unless the code actually changes.

## Verification

- Primary checks are `pnpm lint` and `pnpm build`.
- There is no Vitest/Jest setup in the current package.
