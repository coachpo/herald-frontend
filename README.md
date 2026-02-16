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
