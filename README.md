## Beacon Spear Frontend

Next.js dashboard for Beacon Spear v0.1.

## Local dev

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Defaults:
- frontend: http://localhost:3000
- backend: baked into the build via `NEXT_PUBLIC_API_URL` (default `http://localhost:8100`), and called directly from the browser

## UI (shadcn/ui)

This app uses shadcn/ui-style components under `components/ui/`.

Add new primitives from the shadcn registry (run from `frontend/`):

```bash
npx shadcn@latest add <component>
```

Notes:
- Tailwind is configured in `app/globals.css` (Tailwind v4, CSS-first).
- Global tokens live in `app/globals.css` (`--background`, `--foreground`, `--radius`, etc.).
