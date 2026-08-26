# product-checkout-fe

SPA for buying a single product: product page → card & delivery → payment summary → result → back to product with updated stock.

Built with React and Redux. Mobile-first (iPhone SE as minimum). Deploy target: Vercel. Talks to `product-checkout-be`.

## Structure

Feature-oriented layout + light atomic design:

```
src/
  app/                      # store, typed hooks
  features/                 # product, checkout, payment (filled in later PRs)
  shared/
    api/                    # JSON client + x-api-key
    config/                 # env + display fees
    ui/atoms/               # Button, Input, Text
    validators/             # later
  pages/                    # route screens
```

Only create UI pieces when a stage needs them. Checkout progress will survive refresh later (Redux + localStorage). Card secrets are never stored in full.

## Environment

Copy `.env.example` → `.env` (or `.env.local`). Never commit secrets.

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend base URL (no trailing slash) |
| `VITE_API_KEY` | Same as BE `API_KEY`; sent as header `x-api-key` |
| `VITE_BASE_FEE` / `VITE_DELIVERY_FEE` | Display defaults (COP); API is source of truth |
| `VITE_CURRENCY` | Default `COP` |

Agreed fee defaults: **base `3500.00`**, **delivery `10000.00`**.

## Run locally

```bash
cp .env.example .env
# set VITE_API_URL and VITE_API_KEY to match the backend
npm install
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
- Shell pings `GET /health` on load (no API key required on that route).

## Deploy on Vercel (from this PR onward)

Deploy early: every feature PR should get a **Preview** URL.

1. [Vercel](https://vercel.com) → Add New Project → import `product-checkout-fe`.
2. Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
3. Project env vars (Production + Preview):

| Name | Example |
|------|---------|
| `VITE_API_URL` | `https://your-be.vercel.app` |
| `VITE_API_KEY` | same UUID as BE `API_KEY` |
| `VITE_BASE_FEE` | `3500.00` |
| `VITE_DELIVERY_FEE` | `10000.00` |
| `VITE_CURRENCY` | `COP` |

4. `vercel.json` rewrites all routes to `index.html` (SPA).
5. On the **backend**, set `CORS_ORIGIN` to the FE origin(s), e.g. `https://your-fe.vercel.app` (and `http://localhost:5173` locally).

After the first successful deploy, paste the Production URL here:

- Production: _(add after first deploy)_
- Preview: automatic per PR/branch in the Vercel dashboard / GitHub checks

## Status

- Phase 0: scaffold, env example, fees — done
- Phase bootstrap: Vite + Redux + router — done
- **Phase foundation (`feature/fe-foundation`)**: shared API client, atoms, env/`VITE_API_KEY`, simple CSS, Vercel wiring docs — in progress / this branch
