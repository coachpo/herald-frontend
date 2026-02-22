# frontend/AGENTS.md

## Overview

React 19 + Vite + React Router dashboard UI. Calls backend API directly from browser via `VITE_API_URL`. No server-side proxy or BFF pattern.

## Commands

```bash
pnpm install          # install deps (pnpm 10.29.3 enforced)
pnpm lint             # ESLint 9 flat config
pnpm build            # tsc + vite build (output: dist/)
pnpm dev              # dev server on port 3000
```

## Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives (Radix + CVA + tailwind-merge)
│   │   ├── AppShell.tsx     # Sidebar nav + header layout
│   │   ├── AuthGate.tsx     # Redirect to /login if unauthenticated
│   │   ├── LoginForm.tsx    # Login form with redirect-after-login
│   │   ├── ResetPasswordForm.tsx
│   │   ├── ThemeToggle.tsx  # Light/dark/system theme switcher
│   │   └── VerifyEmailClient.tsx
│   ├── layouts/
│   │   ├── AuthLayout.tsx   # AuthProvider + Outlet (auth pages)
│   │   └── DashboardLayout.tsx  # AuthProvider + AuthGate + AppShell + Outlet
│   ├── lib/
│   │   ├── api.ts           # apiFetch() — browser-to-backend, credentials: "omit"
│   │   ├── auth.tsx         # AuthProvider context, JWT refresh, sessionStorage tokens
│   │   ├── authed.ts        # authedFetch() with auto-refresh on 401
│   │   ├── public-api.ts    # URL builder with localhost detection, UUID-to-hex
│   │   ├── types.ts         # TypeScript types mirroring backend API responses
│   │   └── utils.ts         # cn() helper (clsx + tailwind-merge)
│   ├── pages/
│   │   ├── auth/            # Login, signup, forgot/reset password, verify email
│   │   └── dashboard/       # Dashboard, messages, channels, rules, endpoints, account
│   ├── App.tsx              # Root component rendering AppRoutes
│   ├── globals.css          # Tailwind v4 + theme tokens + Geist font
│   ├── main.tsx             # Entry point (BrowserRouter + TooltipProvider)
│   └── router.tsx           # React Router route definitions
├── index.html               # Vite HTML entry with theme init script
├── vite.config.ts           # Vite config (@tailwindcss/vite, @vitejs/plugin-react)
├── tsconfig.json            # TypeScript config (paths: @/* -> src/*)
├── components.json          # shadcn/ui config (rsc: false)
├── deploy/server.mjs        # Node.js static server for Docker (SPA fallback, /health)
└── Dockerfile               # Multi-stage: pnpm build → node:20-alpine + server.mjs
```

## Key Patterns

- React Router v7 with `<BrowserRouter>` + `<Routes>` + `<Route>` + `<Outlet>`
- shadcn/ui components in `src/components/ui/` — add via `npx shadcn@latest add`
- All components are standard React (no "use client" directives — pure SPA)
- Auth tokens: refresh in sessionStorage, access in React state (memory only)
- Auto-refresh: JWT expiry parsed client-side, refresh fires 60s before expiry
- No unit test runner — `pnpm lint` + `pnpm build` are the primary checks
- Path alias: `@/*` maps to `src/*`
- Theme: custom data-theme attribute (light/dark/system), no next-themes

## Security (Do Not)

- Never persist tokens in localStorage (sessionStorage only)
- Never hardcode secrets in frontend code
- Never render ingested payloads as HTML — treat as plain text
- Never use `dangerouslySetInnerHTML` with user content

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:8100` | Backend API base URL (called from browser) |
