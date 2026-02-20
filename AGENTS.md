# frontend/AGENTS.md

## Overview

Next.js 16 (App Router) dashboard UI. Calls backend API directly from browser via `NEXT_PUBLIC_API_URL`. No server-side proxy or BFF pattern.

## Commands

```bash
pnpm install          # install deps (pnpm 10.29.3 enforced)
pnpm lint             # ESLint 9 flat config
pnpm build            # production build (standalone output)
pnpm dev -p 3000      # dev server
```

## Structure

```
frontend/
├── app/
│   ├── (auth)/           # Login, signup, forgot/reset password, verify email
│   ├── (dashboard)/      # Main app pages (messages, channels, rules, endpoints, account)
│   ├── healthz/route.ts  # Health check (frontend-only, no backend proxy)
│   ├── layout.tsx        # Root layout (AuthProvider, ThemeProvider, Toaster)
│   └── globals.css       # Tailwind v4 CSS-first config + design tokens + dark mode
├── components/
│   ├── ui/               # shadcn/ui primitives (button, card, dialog, table, etc.)
│   ├── AppShell.tsx      # Dashboard shell (sidebar nav, header)
│   ├── AuthGate.tsx      # Redirects unauthenticated users to login
│   └── LoginForm.tsx, ResetPasswordForm.tsx, VerifyEmailClient.tsx, ThemeToggle.tsx
├── lib/
│   ├── api.ts            # apiFetch() — browser-to-backend, credentials: "omit"
│   ├── auth.tsx          # AuthProvider context, JWT refresh, sessionStorage tokens
│   ├── authed.ts         # useAuthedFetch() hook with auto-refresh
│   ├── public-api.ts     # URL builder with localhost detection, UUID-to-hex
│   ├── types.ts          # TypeScript types mirroring backend API responses
│   └── utils.ts          # cn() helper (clsx + tailwind-merge)
└── next.config.ts        # standalone output, turbopack
```

## Where to Look

| Task | Location |
|------|----------|
| Add dashboard page | `app/(dashboard)/{name}/page.tsx` |
| Add auth page | `app/(auth)/{name}/page.tsx` |
| Add UI primitive | `npx shadcn@latest add <component>` → `components/ui/` |
| Modify API client | `lib/api.ts` (fetch wrapper) or `lib/authed.ts` (auth-aware) |
| Change auth flow | `lib/auth.tsx` (AuthProvider) |
| Add TypeScript type | `lib/types.ts` |
| Modify theme/tokens | `app/globals.css` (CSS variables, dark mode via `data-theme`) |

## Conventions

- Tailwind v4 CSS-first: design tokens in `globals.css`, not `tailwind.config`
- Dark mode via `data-theme` attribute (next-themes), not `class` strategy
- shadcn/ui components in `components/ui/` — add via `npx shadcn@latest add`
- All pages are client components (`"use client"`) — no SSR data fetching
- Auth tokens: refresh in sessionStorage, access in React state (memory only)
- Auto-refresh: JWT expiry parsed client-side, refresh fires 60s before expiry
- No unit test runner — `pnpm lint` + `pnpm build` are the primary checks
- Path alias: `@/*` maps to project root

## Security (Do Not)

- Never persist tokens in localStorage (sessionStorage only)
- Never hardcode secrets in frontend code
- Never render ingested payloads as HTML — treat as plain text
- Never use `dangerouslySetInnerHTML` with user content

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8100` | Backend API base URL (called from browser) |
