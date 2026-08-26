import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from '@/app/appSlice';
import { productReducer } from '@/features/product/productSlice';
import { checkoutReducer } from '@/features/checkout/checkoutSlice';
import { runPayFlow } from '@/features/checkout/runPayFlow';
import { PaymentResult } from './PaymentResult';
import * as productApi from '@/features/product/api';

jest.mock('@/features/product/api', () => ({
  listProducts: jest.fn(),
  getProduct: jest.fn(),
}));

function buildStore() {
  return configureStore({
    reducer: {
      app: appReducer,
      product: productReducer,
      checkout: checkoutReducer,
    },
  });
}

describe('PaymentResult', () => {
  it('shows approved state and returns to product', async () => {
    // Arrange
    (productApi.listProducts as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(
      [],
    );
    const store = buildStore();
    store.dispatch({
      type: runPayFlow.fulfilled.type,
      payload: {
        customerId: 'c1',
        deliveryId: 'd1',
        transaction: {
          id: 't1',
          reference: 'ref-9',
          status: 'APPROVED',
          productId: 'p1',
          customerId: 'c1',
          deliveryId: 'd1',
          quantity: 1,
          amount: 100,
          baseFee: 3500,
          deliveryFee: 10000,
          total: 13600,
          currency: 'COP',
          providerTransactionId: 'prov',
          cardBrand: 'VISA',
          cardLastFour: '4242',
        },
      },
    });

    // Act
    render(
      <Provider store={store}>
        <PaymentResult />
      </Provider>,
    );

    // Assert
    expect(screen.getByText('Payment approved')).toBeTruthy();
    expect(screen.getByText('ref-9')).toBeTruthy();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Back to product' }));

    // Assert
    expect(store.getState().checkout.step).toBe('closed');
  });

  it('shows declined and allows try again', () => {
    // Arrange
    const store = buildStore();
    store.dispatch({
      type: runPayFlow.fulfilled.type,
      payload: {
        customerId: 'c1',
        deliveryId: 'd1',
        transaction: {
          id: 't1',
          reference: 'ref-d',
          status: 'DECLINED',
          productId: 'p1',
          customerId: 'c1',
          deliveryId: 'd1',
          quantity: 1,
          amount: 100,
          baseFee: 3500,
          deliveryFee: 10000,
          total: 13600,
          currency: 'COP',
          providerTransactionId: null,
          cardBrand: 'VISA',
          cardLastFour: '4242',
        },
      },
    });

    render(
      <Provider store={store}>
        <PaymentResult />
      </Provider>,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Assert
    expect(store.getState().checkout.step).toBe('summary');
  });

  it('shows API error path', () => {
    // Arrange
    const store = buildStore();
    store.dispatch({
      type: runPayFlow.rejected.type,
      payload: 'network down',
      error: { message: 'network down' },
    });

    // Act
    render(
      <Provider store={store}>
        <PaymentResult />
      </Provider>,
    );

    // Assert
    expect(screen.getByText('Payment error')).toBeTruthy();
    expect(screen.getByText('network down')).toBeTruthy();
  });
});
