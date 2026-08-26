# product-checkout-fe

[![CI](https://github.com/oramirez1512-CO/product-checkout-fe/actions/workflows/ci.yml/badge.svg)](https://github.com/oramirez1512-CO/product-checkout-fe/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/oramirez1512-CO/product-checkout-fe/graph/badge.svg)](https://codecov.io/gh/oramirez1512-CO/product-checkout-fe)

SPA for buying a single product: product page → card & delivery → payment summary → result → back to product with updated stock.

Built with React and Redux. Mobile-first (iPhone SE as minimum). Deploy target: Vercel. Talks to `product-checkout-be`.

## Structure

Feature-oriented layout + light atomic design:

```
src/
  app/                      # store, typed hooks
  features/
    product/                # api, slice, ProductPage, ProductCard
    checkout/ payment/      # later
  shared/
    api/                    # JSON client + x-api-key
    config/                 # env + display fees
    lib/                    # money helpers
    ui/atoms/               # Button, Input, Text
    validators/             # later
  pages/                    # /status diagnostics
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
| `npm run test:cov` | Tests + coverage report (threshold ≥80% lines/statements) |

- App: `http://localhost:5173` (product catalog)
- Diagnostics / health: `http://localhost:5173/status`

Coverage HTML: `coverage/lcov-report/index.html` after `npm run test:cov`.

## How to view coverage

There are three ways to inspect coverage. Prefer **Codecov** for reviews; use local HTML while developing.

### 1. Codecov (visual dashboard — public)

Dashboard: [app.codecov.io/gh/oramirez1512-CO/product-checkout-fe](https://app.codecov.io/gh/oramirez1512-CO/product-checkout-fe)

Anyone can open it while the repository is public. The badge at the top of this README links to the same place.

**What you can see in Codecov**

| View | What it shows |
|------|----------------|
| **Overview / sunburst** | Global coverage % for the branch (statements covered vs total). Trend over recent commits. |
| **File tree** | Coverage broken down by folder (`features/`, `shared/`, `app/`, …). Useful to spot weak areas quickly. |
| **Single file** | Source code with lines highlighted: **green** = covered by at least one test, **red** = not executed, **yellow/partial** = only some branches hit. |
| **Pull request** | Patch coverage (only lines added/changed in the PR) vs project coverage. Flags drops below the targets in `codecov.yml` (project/patch ~80%). |
| **PR comment on GitHub** | After CI uploads a report, Codecov comments on the PR with a short summary. |

**One-time setup** (repo owner; free for public repos):

1. Sign in at [codecov.io](https://codecov.io) with GitHub and grant access to `product-checkout-fe`.
2. In Codecov → repo **Settings**, copy the **Upload token**.
3. In GitHub → **Settings → Secrets and variables → Actions**, create secret:
   - Name: `CODECOV_TOKEN`
   - Value: the upload token
4. Push or re-run the **CI** workflow. After the first successful upload, the badge and dashboard populate.

### 2. Local HTML (Istanbul)

```bash
npm run test:cov
open coverage/lcov-report/index.html   # macOS
```

### 3. GitHub Actions artifact

1. Open the repo on GitHub → **Actions**.
2. Select the latest **CI** run.
3. Under **Artifacts**, download **`coverage-report`**.
4. Unzip and open `index.html` locally.

## CI (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

On push/PR to `main` / `develop` / `feature/**`:

1. `npm ci`
2. `npm run build`
3. `npm run test:cov` (fails if global coverage drops below the Jest threshold: ≥80% statements/lines/functions, ≥70% branches)
4. Uploads `coverage/lcov.info` to Codecov
5. Uploads the HTML report as artifact **`coverage-report`**

## Deploy on Vercel (from foundation PR onward)

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
- Phase foundation: shared API client, atoms, env/`VITE_API_KEY`, Vercel — done
- **Phase product page (`feature/fe-product-page`)**: `GET /products`, ProductCard, loading/error/empty, Buy CTA (selection in Redux for checkout next)
- Coverage: Jest threshold ≥80%, CI + Codecov (`codecov.yml`) wired from this PR (same pattern as BE)
