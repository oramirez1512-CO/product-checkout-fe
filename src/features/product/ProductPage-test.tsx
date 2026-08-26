import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProductPage } from './ProductPage';
import { productReducer } from './productSlice';
import { appReducer } from '@/app/appSlice';
import { checkoutReducer } from '@/features/checkout/checkoutSlice';
import * as productApi from './api';

jest.mock('./api', () => ({
  listProducts: jest.fn(),
  getProduct: jest.fn(),
}));

const mockedList = productApi.listProducts as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mockRejectedValueOnce: (value: unknown) => {
    mockResolvedValueOnce: (value: unknown) => void;
  };
};

function renderPage() {
  const store = configureStore({
    reducer: {
      app: appReducer,
      product: productReducer,
      checkout: checkoutReducer,
    },
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    ),
  };
}

describe('ProductPage', () => {
  beforeEach(() => {
    mockedList.mockReset();
  });

  it('loads and shows product (happy path)', async () => {
    // Arrange
    mockedList.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Aurora',
        description: 'Headphones',
        price: 249900,
        stock: 5,
        imageUrl: null,
      },
    ]);

    // Act
    renderPage();

    // Assert
    expect(screen.getByText(/Loading product/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Aurora')).toBeTruthy();
    });
  });

  it('shows empty state when catalog has no products', async () => {
    // Arrange
    mockedList.mockResolvedValue([]);

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/No products in catalog/)).toBeTruthy();
    });
  });

  it('shows error and retries', async () => {
    // Arrange
    mockedList
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce([
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Aurora',
          description: 'Headphones',
          price: 249900,
          stock: 5,
          imageUrl: null,
        },
      ]);

    // Act
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Aurora')).toBeTruthy();
    });
  });

  it('Buy selects product and opens checkout modal', async () => {
    // Arrange
    mockedList.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Aurora',
        description: 'Headphones',
        price: 249900,
        stock: 5,
        imageUrl: null,
      },
    ]);
    const { store } = renderPage();
    await waitFor(() => screen.getByText('Aurora'));

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));

    // Assert
    expect(store.getState().product.selectedId).toBe(
      '11111111-1111-4111-8111-111111111111',
    );
    expect(store.getState().checkout.step).toBe('form');
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByLabelText('Full name')).toBeTruthy();
  });
});
