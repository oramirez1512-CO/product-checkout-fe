import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';

const product: Product = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Aurora Wireless Headphones',
  description: 'Over-ear Bluetooth headphones.',
  price: 249900,
  stock: 12,
  imageUrl: null,
};

describe('ProductCard', () => {
  it('renders name, stock and calls onBuy', () => {
    // Arrange
    const onBuy = jest.fn();

    // Act
    render(<ProductCard product={product} onBuy={onBuy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));

    // Assert
    expect(screen.getByText(product.name)).toBeTruthy();
    expect(screen.getByText(/12 available/)).toBeTruthy();
    expect(onBuy).toHaveBeenCalledWith(product.id);
  });

  it('disables buy when stock is below min (0)', () => {
    // Arrange
    const onBuy = jest.fn();

    // Act
    render(
      <ProductCard product={{ ...product, stock: 0 }} onBuy={onBuy} />,
    );

    // Assert
    const button = screen.getByRole('button', { name: 'Unavailable' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(onBuy).not.toHaveBeenCalled();
  });

  it('renders image when imageUrl is set', () => {
    // Act
    render(
      <ProductCard
        product={{ ...product, imageUrl: 'https://cdn.example/a.png' }}
        onBuy={jest.fn()}
      />,
    );

    // Assert
    expect(document.querySelector('img.product-card__image')).toBeTruthy();
  });
});
