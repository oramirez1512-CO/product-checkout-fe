import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Text } from '@/shared/ui/atoms';
import {
  fetchProducts,
  selectPrimaryProduct,
  selectProduct,
} from './productSlice';
import { ProductCard } from './ui/ProductCard';

export function ProductPage() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.product.status);
  const error = useAppSelector((state) => state.product.error);
  const product = useAppSelector(selectPrimaryProduct);
  const selectedId = useAppSelector((state) => state.product.selectedId);

  useEffect(() => {
    void dispatch(fetchProducts());
  }, [dispatch]);

  function handleRetry() {
    void dispatch(fetchProducts());
  }

  function handleBuy(productId: string) {
    dispatch(selectProduct(productId));
    // Checkout form lands in stage 3 — selection is ready in Redux.
  }

  return (
    <main className="page page--product">
      <header className="page__header">
        <Text as="h2" className="page__eyebrow">
          Catalog
        </Text>
        <Text tone="muted">
          Single-product MVP loaded from the API. Checkout form comes next.
        </Text>
      </header>

      {status === 'loading' || status === 'idle' ? (
        <Text tone="muted" className="page__status">
          Loading product…
        </Text>
      ) : null}

      {status === 'failed' ? (
        <div className="page__status page__status--error" role="alert">
          <Text tone="danger">{error ?? 'Could not load products'}</Text>
          <Button type="button" variant="secondary" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      {status === 'succeeded' && !product ? (
        <Text tone="muted" className="page__status">
          No products in catalog yet.
        </Text>
      ) : null}

      {product ? (
        <>
          <ProductCard product={product} onBuy={handleBuy} />
          {selectedId === product.id ? (
            <Text tone="muted" className="page__hint">
              Selected for checkout (form in the next release).
            </Text>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
