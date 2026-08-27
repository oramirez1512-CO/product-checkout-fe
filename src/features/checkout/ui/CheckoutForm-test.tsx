import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from '@/app/appSlice';
import { productReducer } from '@/features/product/productSlice';
import { checkoutReducer, openCheckout } from '@/features/checkout/checkoutSlice';
import { CheckoutForm } from './CheckoutForm';

function renderForm() {
  const store = configureStore({
    reducer: {
      app: appReducer,
      product: productReducer,
      checkout: checkoutReducer,
    },
  });
  store.dispatch(openCheckout());
  return {
    store,
    ...render(
      <Provider store={store}>
        <CheckoutForm />
      </Provider>,
    ),
  };
}

const futureYear = String(new Date().getFullYear() + 2);

describe('CheckoutForm', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('shows validation errors on empty submit', async () => {
    // Arrange
    renderForm();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));

    // Assert
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/Full name is required/i)).toBeTruthy();
  });

  it('saves valid draft and moves checkout to summary step', async () => {
    // Arrange
    const { store } = renderForm();

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Ada Buyer' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Phone (optional)'), {
      target: { value: '3001234567' },
    });
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: 'Calle 1' },
    });
    fireEvent.change(screen.getByLabelText('City'), {
      target: { value: 'Bogotá' },
    });
    fireEvent.change(screen.getByLabelText('Region'), {
      target: { value: 'Cundinamarca' },
    });
    fireEvent.change(screen.getByLabelText('Postal code (optional)'), {
      target: { value: '110111' },
    });
    fireEvent.change(screen.getByLabelText('Card number'), {
      target: { value: '4242424242424242' },
    });
    fireEvent.change(screen.getByLabelText('Cardholder'), {
      target: { value: 'Ada Buyer' },
    });
    fireEvent.change(screen.getByLabelText('Month'), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByLabelText('Year'), {
      target: { value: futureYear },
    });
    fireEvent.change(screen.getByLabelText('CVC'), {
      target: { value: '123' },
    });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));

    // Assert
    await waitFor(() => {
      expect(store.getState().checkout.step).toBe('summary');
    });
    expect(store.getState().checkout.card.lastFour).toBe('4242');
  });

  it('cancel closes checkout', () => {
    // Arrange
    const { store } = renderForm();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(store.getState().checkout.step).toBe('closed');
  });
});
