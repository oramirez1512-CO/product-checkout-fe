import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from '@/app/appSlice';
import { productReducer, fetchProducts } from '@/features/product/productSlice';
import {
  checkoutReducer,
  confirmSummaryForPay,
  submitCheckoutDraft,
} from '@/features/checkout/checkoutSlice';
import { injectAppEnv } from '@/shared/config/env';
import { PaymentSummary } from './PaymentSummary';

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

  it('Pay advances to pay placeholder step', () => {
    // Arrange
    const store = buildStore();
    seedSummary(store);
    render(
      <Provider store={store}>
        <PaymentSummary />
      </Provider>,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Pay' }));

    // Assert
    expect(store.getState().checkout.step).toBe('pay');
    expect(screen.getByText('Ready to pay')).toBeTruthy();
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
    store.dispatch(submitCheckoutDraft({
      customer: { email: 'a@b.co', fullName: 'A', phone: '' },
      delivery: { address: 'x', city: 'y', region: 'z', postalCode: '' },
      card: {
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: futureYear,
        cardHolder: 'A',
      },
    }));

    // Act
    render(
      <Provider store={store}>
        <PaymentSummary />
      </Provider>,
    );

    // Assert
    expect(screen.getByText(/Summary unavailable/i)).toBeTruthy();
  });

  it('confirm from pay view can go back', () => {
    // Arrange
    const store = buildStore();
    seedSummary(store);
    store.dispatch(confirmSummaryForPay());

    // Act
    render(
      <Provider store={store}>
        <PaymentSummary />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    // Assert
    expect(store.getState().checkout.step).toBe('form');
  });
});
