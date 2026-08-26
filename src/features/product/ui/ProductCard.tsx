import { Button, Text } from '@/shared/ui/atoms';
import { formatMoney } from '@/shared/lib/money';
import type { Product } from '../types';

export type ProductCardProps = {
  product: Product;
  onBuy: (productId: string) => void;
};

export function ProductCard({ product, onBuy }: ProductCardProps) {
  const outOfStock = product.stock < 1;

  return (
    <article className="product-card">
      <div
        className="product-card__media"
        aria-hidden={product.imageUrl ? undefined : true}
      >
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="product-card__image" />
        ) : (
          <div className="product-card__placeholder">No image</div>
        )}
      </div>

      <div className="product-card__body">
        <Text as="h1" className="product-card__title">
          {product.name}
        </Text>
        <Text tone="muted" className="product-card__description">
          {product.description}
        </Text>

        <dl className="product-card__meta">
          <div>
            <dt>Price</dt>
            <dd>{formatMoney(product.price)}</dd>
          </div>
          <div>
            <dt>Stock</dt>
            <dd className={outOfStock ? 'is-danger' : undefined}>
              {outOfStock ? 'Out of stock' : `${product.stock} available`}
            </dd>
          </div>
        </dl>

        <Button
          type="button"
          disabled={outOfStock}
          onClick={() => onBuy(product.id)}
        >
          {outOfStock ? 'Unavailable' : 'Buy'}
        </Button>
      </div>
    </article>
  );
}
