# product-checkout-fe

SPA for buying a single product: product page → card & delivery → payment summary → result → back to product with updated stock.

Built with React and Redux. Mobile-first (iPhone SE as minimum). Deploy target: Vercel. Talks to `product-checkout-be`.

## Structure

Feature-oriented layout under `src/`:

```
src/
  app/               # store and app-level wiring
  features/          # product, checkout, payment
  shared/            # ui, api client, validators, config
  pages/             # route-level screens
```

Checkout progress should survive refresh (Redux + localStorage). Card secrets are never stored in full.

## Environment

Copy `.env.example` → `.env` (or `.env.local`) and point at the API. Never commit secrets.

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend base URL |
| `VITE_BASE_FEE` / `VITE_DELIVERY_FEE` | Display defaults (COP); API is source of truth |
| `VITE_CURRENCY` | Default `COP` |

Agreed fee defaults: **base `3500.00`**, **delivery `10000.00`** (same as backend). Also in `src/shared/config/fees.ts`.

## Run locally

Prerequisites: Node.js 20+, npm. Backend should be running (or `VITE_API_URL` pointing at a reachable API).

```bash
# 1. Env
cp .env.example .env
# edit .env — VITE_API_URL (default http://localhost:3000)

# 2. Install
npm install

# 3. Dev server
npm run dev
```

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (Jest) |
| `npm run test:cov` | Tests + coverage report |

- App: `http://localhost:5173`

## Status

Phase 0 done: scaffold, env example, agreed fees.

Phase 1 (bootstrap): Vite + React + Redux Toolkit + router. Shell page at `/`. No checkout screens yet.
