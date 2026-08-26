import { describe, expect, it } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { productReducer, fetchProducts, selectProduct } from './productSlice';

describe('productSlice', () => {
  function buildStore() {
    return configureStore({
      reducer: { product: productReducer },
    });
  }

  it('stores products on fetchProducts.fulfilled', () => {
    // Arrange
    const store = buildStore();
    const products = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Aurora',
        description: 'Headphones',
        price: 249900,
        stock: 12,
        imageUrl: null,
      },
    ];

    // Act
    store.dispatch({
      type: fetchProducts.fulfilled.type,
      payload: products,
    });

    // Assert
    expect(store.getState().product.status).toBe('succeeded');
    expect(store.getState().product.items).toEqual(products);
  });

  it('selectProduct sets selectedId', () => {
    const store = buildStore();
    store.dispatch(selectProduct('abc'));
    expect(store.getState().product.selectedId).toBe('abc');
  });

  it('maps fetchProducts.rejected to failed status', () => {
    const store = buildStore();
    store.dispatch({
      type: fetchProducts.rejected.type,
      payload: 'boom',
      error: { message: 'boom' },
    });
    expect(store.getState().product.status).toBe('failed');
    expect(store.getState().product.error).toBe('boom');
  });
});
