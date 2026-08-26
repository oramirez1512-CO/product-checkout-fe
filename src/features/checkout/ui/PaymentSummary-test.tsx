import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from '@/app/appSlice';
import { productReducer, fetchProducts } from '@/features/product/productSlice';
import { checkoutReducer, submitCheckoutDraft } from '@/features/checkout/checkoutSlice';
import { injectAppEnv } from '@/shared/config/env';
import { PaymentSummary } from './PaymentSummary';
import * as checkoutApi from '../api';

jest.mock('../api', () => ({
  upsertCustomer: jest.fn(),
  createDelivery: jest.fn(),
  createPendingTransaction: jest.fn(),
  payTransaction: jest.fn(),
}));

const mockedApi = checkoutApi as unknown as {
  upsertCustomer: { mockResolvedValue: (v: unknown) => void };
  createDelivery: { mockResolvedValue: (v: unknown) => void };
  createPendingTransaction: { mockResolvedValue: (v: unknown) => void };
  payTransaction: { mockResolvedValue: (v: unknown) => void };
};

const futureYear = String(new Date().getFullYear() + 2);

const product = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Aurora',
  description: 'Headphones',
  price: 249900,
  stock: 5,
  imageUrl: null,
};

function buildStore() {
  return configureStore({
    reducer: {
      app: appReducer,
      product: productReducer,
      checkout: checkoutReducer,
    },
  });
}

function seedSummary(store: ReturnType<typeof buildStore>) {
  store.dispatch({
    type: fetchProducts.fulfilled.type,
    payload: [product],
  });
  store.dispatch(
    submitCheckoutDraft({
      customer: {
        email: 'ada@example.com',
        fullName: 'Ada Buyer',
        phone: '',
      },
      delivery: {
        address: 'Calle 1',
        city: 'Bogotá',
        region: 'Cundinamarca',
        postalCode: '',
      },
      card: {
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: futureYear,
        cardHolder: 'Ada Buyer',
      },
    }),
  );
}

describe('PaymentSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders product fees and estimated total', () => {
    // Arrange
    injectAppEnv({
      VITE_BASE_FEE: '3500',
      VITE_DELIVERY_FEE: '10000',
      VITE_CURRENCY: 'COP',
    });
    const store = buildStore();
    seedSummary(store);

    // Act
    render(
      <Provider store={store}>
        <PaymentSummary />
      </Provider>,
    );

    // Assert
    expect(screen.getByText('Payment summary')).toBeTruthy();
    expect(screen.getByText('Aurora')).toBeTruthy();
    expect(screen.getByText('Base fee')).toBeTruthy();
    expect(screen.getByText('Delivery fee')).toBeTruthy();
    expect(screen.getByText('Estimated total')).toBeTruthy();
    expect(screen.getByText(/Ada Buyer/)).toBeTruthy();
    expect(screen.getByText(/Visa/)).toBeTruthy();
  });

  it('Pay runs orchestration and reaches result', async () => {
    // Arrange
    const store = buildStore();
    seedSummary(store);
    mockedApi.upsertCustomer.mockResolvedValue({
      id: 'c1',
      email: 'ada@example.com',
      fullName: 'Ada Buyer',
      phone: null,
    });
    mockedApi.createDelivery.mockResolvedValue({
      id: 'd1',
      customerId: 'c1',
      address: 'Calle 1',
      city: 'Bogotá',
      region: 'Cundinamarca',
      postalCode: null,
    });
    mockedApi.createPendingTransaction.mockResolvedValue({
      id: 't1',
      reference: 'r1',
      status: 'PENDING',
      productId: product.id,
      customerId: 'c1',
      deliveryId: 'd1',
      quantity: 1,
      amount: 249900,
      baseFee: 3500,
      deliveryFee: 10000,
      total: 263400,
      currency: 'COP',
      providerTransactionId: null,
      cardBrand: null,
      cardLastFour: null,
    });
    mockedApi.payTransaction.mockResolvedValue({
      id: 't1',
      reference: 'r1',
      status: 'APPROVED',
      productId: product.id,
      customerId: 'c1',
      deliveryId: 'd1',
      quantity: 1,
      amount: 249900,
      baseFee: 3500,
      deliveryFee: 10000,
      total: 263400,
      currency: 'COP',
      providerTransactionId: 'p1',
      cardBrand: 'VISA',
      cardLastFour: '4242',
    });

    render(
      <Provider store={store}>
        <PaymentSummary />
      </Provider>,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Pay' }));

    // Assert
    await waitFor(() => {
      expect(store.getState().checkout.step).toBe('result');
    });
    expect(store.getState().checkout.transaction?.status).toBe('APPROVED');
  });

  it('Edit details returns to form', () => {
    // Arrange
    const store = buildStore();
    seedSummary(store);
    render(
      <Provider store={store}>
        <PaymentSummary />
      </Provider>,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Edit details' }));

    // Assert
    expect(store.getState().checkout.step).toBe('form');
  });

  it('shows unavailable when product missing', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(
      submitCheckoutDraft({
        customer: { email: 'a@b.co', fullName: 'A', phone: '' },
        delivery: { address: 'x', city: 'y', region: 'z', postalCode: '' },
        card: {
          number: '4242424242424242',
          cvc: '123',
          expMonth: '12',
          expYear: futureYear,
          cardHolder: 'A',
        },
      }),
    );

    // Act
    render(
      <Provider store={store}>
        <PaymentSummary />
      </Provider>,
    );

    // Assert
    expect(screen.getByText(/Summary unavailable/i)).toBeTruthy();
  });
});
