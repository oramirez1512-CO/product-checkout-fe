import { describe, expect, it } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import {
  checkoutReducer,
  closeCheckout,
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

  it('submitCheckoutDraft marks ready and normalizes email', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(openCheckout());

    // Act
    store.dispatch(
      submitCheckoutDraft({
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
      }),
    );

    // Assert
    const state = store.getState().checkout;
    expect(state.step).toBe('ready');
    expect(state.customer.email).toBe('ada@x.co');
    expect(state.card.expMonth).toBe('01');
    expect(state.card.cardHolder).toBe('Ada');
    expect(selectCheckoutDraft(store.getState()).card.number).toBe(
      '4242424242424242',
    );
  });

  it('editing after ready returns to form', () => {
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
  });
});
