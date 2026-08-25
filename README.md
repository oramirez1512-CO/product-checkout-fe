# product-checkout-fe

SPA for buying a single product: product page → card & delivery → payment summary → result → back to product with updated stock.

Built with React and Redux. Mobile-first (iPhone SE as minimum). Deploy target: Vercel. Talks to `product-checkout-be`.

## Structure

Feature-oriented layout under `src/`:

```
src/
  app/               # store and app-level wiring
  features/          # product, checkout, payment
  shared/            # ui, api client, validators
  pages/             # route-level screens
```

Checkout progress should survive refresh (Redux + localStorage). Card secrets are never stored in full.

## Status

Scaffold only — folder structure is in place. App bootstrap, screens, and API wiring come next.
