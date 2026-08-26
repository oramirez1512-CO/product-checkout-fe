import { describe, expect, it, jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import {
  productReducer,
  fetchProducts,
  selectProduct,
  clearProductError,
  selectPrimaryProduct,
} from './productSlice';
import { ApiError } from '@/shared/api/client';
import * as productApi from './api';

jest.mock('./api', () => ({
  listProducts: jest.fn(),
  getProduct: jest.fn(),
}));

const mockedList = productApi.listProducts as unknown as {
  mockResolvedValue: (value: unknown) => void;
  mockRejectedValue: (value: unknown) => void;
};

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
    expect(selectPrimaryProduct(store.getState())).toEqual(products[0]);
  });

  it('selectProduct sets selectedId', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch(selectProduct('abc'));

    // Assert
    expect(store.getState().product.selectedId).toBe('abc');
  });

  it('clearProductError resets error', () => {
    // Arrange
    const store = buildStore();
    store.dispatch({
      type: fetchProducts.rejected.type,
      payload: 'boom',
      error: { message: 'boom' },
    });

    // Act
    store.dispatch(clearProductError());

    // Assert
    expect(store.getState().product.error).toBeNull();
  });

  it('maps fetchProducts.rejected to failed status', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch({
      type: fetchProducts.rejected.type,
      payload: 'boom',
      error: { message: 'boom' },
    });

    // Assert
    expect(store.getState().product.status).toBe('failed');
    expect(store.getState().product.error).toBe('boom');
  });

  it('clears selectedId when product disappears after refresh', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(selectProduct('gone-id'));

    // Act
    store.dispatch({
      type: fetchProducts.fulfilled.type,
      payload: [
        {
          id: 'other',
          name: 'X',
          description: 'd',
          price: 1,
          stock: 1,
          imageUrl: null,
        },
      ],
    });

    // Assert
    expect(store.getState().product.selectedId).toBeNull();
  });

  it('fetchProducts thunk maps ApiError via rejectWithValue', async () => {
    // Arrange
    mockedList.mockRejectedValue(new ApiError('nope', 500));
    const store = buildStore();

    // Act
    await store.dispatch(fetchProducts());

    // Assert
    expect(store.getState().product.status).toBe('failed');
    expect(store.getState().product.error).toBe('nope');
  });

  it('fetchProducts thunk maps generic Error message', async () => {
    // Arrange
    mockedList.mockRejectedValue(new Error('network'));
    const store = buildStore();

    // Act
    await store.dispatch(fetchProducts());

    // Assert
    expect(store.getState().product.error).toBe('network');
  });

  it('fetchProducts thunk maps unknown errors', async () => {
    // Arrange
    mockedList.mockRejectedValue(99);
    const store = buildStore();

    // Act
    await store.dispatch(fetchProducts());

    // Assert
    expect(store.getState().product.error).toBe('Failed to load products');
  });

  it('fetchProducts thunk stores catalog on success', async () => {
    // Arrange
    const products = [
      {
        id: '1',
        name: 'A',
        description: 'd',
        price: 1,
        stock: 1,
        imageUrl: null,
      },
    ];
    mockedList.mockResolvedValue(products);
    const store = buildStore();

    // Act
    await store.dispatch(fetchProducts());

    // Assert
    expect(store.getState().product.items).toEqual(products);
  });

  it('rejected without string payload uses error.message', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch({
      type: fetchProducts.rejected.type,
      error: { message: 'from-error' },
    });

    // Assert
    expect(store.getState().product.error).toBe('from-error');
  });

  it('rejected without payload or message uses default', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch({
      type: fetchProducts.rejected.type,
      error: {},
    });

    // Assert
    expect(store.getState().product.error).toBe('Failed to load products');
  });

  it('keeps selectedId when product still exists after refresh', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(selectProduct('keep-me'));

    // Act
    store.dispatch({
      type: fetchProducts.fulfilled.type,
      payload: [
        {
          id: 'keep-me',
          name: 'X',
          description: 'd',
          price: 1,
          stock: 1,
          imageUrl: null,
        },
      ],
    });

    // Assert
    expect(store.getState().product.selectedId).toBe('keep-me');
  });

  it('selectPrimaryProduct is null when empty', () => {
    // Arrange / Act / Assert
    expect(selectPrimaryProduct({ product: buildStore().getState().product })).toBeNull();
  });

  it('fetchProducts pending sets loading', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch({ type: fetchProducts.pending.type });

    // Assert
    expect(store.getState().product.status).toBe('loading');
  });
});
