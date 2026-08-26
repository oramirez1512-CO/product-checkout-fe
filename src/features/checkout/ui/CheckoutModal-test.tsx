import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { checkoutReducer, openCheckout } from '../checkoutSlice';
import { CheckoutModal } from './CheckoutModal';

describe('CheckoutModal', () => {
  it('renders nothing when closed', () => {
    // Arrange
    const store = configureStore({
      reducer: { checkout: checkoutReducer },
    });

    // Act
    const { container } = render(
      <Provider store={store}>
        <CheckoutModal open={false}>
          <div>inside</div>
        </CheckoutModal>
      </Provider>,
    );

    // Assert
    expect(container.textContent).toBe('');
  });

  it('closes when backdrop is clicked', () => {
    // Arrange
    const store = configureStore({
      reducer: { checkout: checkoutReducer },
    });
    store.dispatch(openCheckout());
    render(
      <Provider store={store}>
        <CheckoutModal open>
          <div>inside</div>
        </CheckoutModal>
      </Provider>,
    );

    // Act
    screen.getByLabelText('Close checkout').click();

    // Assert
    expect(store.getState().checkout.step).toBe('closed');
  });
});
