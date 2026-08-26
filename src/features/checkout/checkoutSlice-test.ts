import { describe, expect, it } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import {
  backToCheckoutForm,
  checkoutReducer,
  closeCheckout,
  confirmSummaryForPay,
  openCheckout,
  resetCheckout,
  selectCheckoutDraft,
  submitCheckoutDraft,
  updateCardDraft,
  updateCustomerDraft,
  updateDeliveryDraft,
} from './checkoutSlice';

function buildStore() {
  return configureStore({ reducer: { checkout: checkoutReducer } });
}

const futureYear = String(new Date().getFullYear() + 2);

const validDraft = () => ({
  customer: { email: 'Ada@X.co', fullName: 'Ada', phone: '' },
  delivery: {
    address: 'Calle 1',
    city: 'Bogotá',
    region: 'Cund',
    postalCode: '',
  },
  card: {
    number: '4242 4242 4242 4242',
    cvc: '123',
    expMonth: '1',
    expYear: futureYear,
    cardHolder: ' Ada ',
  },
});

describe('checkoutSlice', () => {
  it('opens and closes the form step', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch(openCheckout());

    // Assert
    expect(store.getState().checkout.step).toBe('form');

    // Act
    store.dispatch(closeCheckout());

    // Assert
    expect(store.getState().checkout.step).toBe('closed');
  });

  it('patches customer and delivery drafts', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch(updateCustomerDraft({ email: 'a@b.co', fullName: 'Ada' }));
    store.dispatch(updateDeliveryDraft({ city: 'Bogotá' }));

    // Assert
    expect(store.getState().checkout.customer.email).toBe('a@b.co');
    expect(store.getState().checkout.delivery.city).toBe('Bogotá');
  });

  it('derives brand and last4 from card draft', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch(
      updateCardDraft({
        number: '5555555555554444',
        cvc: '123',
        expMonth: '12',
        expYear: futureYear,
        cardHolder: 'Ada',
      }),
    );

    // Assert
    expect(store.getState().checkout.card.brand).toBe('mastercard');
    expect(store.getState().checkout.card.lastFour).toBe('4444');
  });

  it('submitCheckoutDraft opens summary and normalizes email', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(openCheckout());

    // Act
    store.dispatch(submitCheckoutDraft(validDraft()));

    // Assert
    const state = store.getState().checkout;
    expect(state.step).toBe('summary');
    expect(state.customer.email).toBe('ada@x.co');
    expect(state.card.expMonth).toBe('01');
    expect(state.card.cardHolder).toBe('Ada');
    expect(selectCheckoutDraft(store.getState()).card.number).toBe(
      '4242424242424242',
    );
  });

  it('confirmSummaryForPay advances only from summary', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(submitCheckoutDraft(validDraft()));

    // Act
    store.dispatch(confirmSummaryForPay());

    // Assert
    expect(store.getState().checkout.step).toBe('pay');

    // Act — ignored when already pay
    store.dispatch(confirmSummaryForPay());

    // Assert
    expect(store.getState().checkout.step).toBe('pay');
  });

  it('backToCheckoutForm returns to form from summary', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(submitCheckoutDraft(validDraft()));

    // Act
    store.dispatch(backToCheckoutForm());

    // Assert
    expect(store.getState().checkout.step).toBe('form');
  });

  it('editing after summary returns to form', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(submitCheckoutDraft(validDraft()));

    // Act
    store.dispatch(updateCustomerDraft({ fullName: 'B' }));

    // Assert
    expect(store.getState().checkout.step).toBe('form');
  });

  it('resetCheckout clears state', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(openCheckout());

    // Act
    store.dispatch(resetCheckout());

    // Assert
    expect(store.getState().checkout.step).toBe('closed');
    expect(store.getState().checkout.customer.email).toBe('');
    expect(store.getState().checkout.quantity).toBe(1);
  });
});
