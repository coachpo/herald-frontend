## Beacon Spear Frontend

React 19 + Vite + React Router dashboard for Beacon Spear.

## Local dev

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Defaults:
- frontend: http://localhost:3000
- backend: baked into the build via `VITE_API_URL` (default `http://localhost:8100`), and called directly from the browser

## UI (shadcn/ui)

This app uses shadcn/ui-style components under `src/components/ui/`.

Add new primitives from the shadcn registry (run from `frontend/`):

```bash
npx shadcn@latest add <component>
```

Notes:
- Tailwind is configured in `src/globals.css` (Tailwind v4, CSS-first).
- Global tokens live in `src/globals.css` (`--background`, `--foreground`, `--radius`, etc.).
