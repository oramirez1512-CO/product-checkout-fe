import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const loadCheckoutSnapshot = jest.fn();
const saveCheckoutSnapshot = jest.fn();
const clearCheckoutSnapshot = jest.fn();
const buildPersistedSnapshot = jest.fn((input: unknown) => input);

jest.mock('@/features/checkout/persistence', () => ({
  loadCheckoutSnapshot: () => loadCheckoutSnapshot(),
  saveCheckoutSnapshot: (snapshot: unknown) => saveCheckoutSnapshot(snapshot),
  clearCheckoutSnapshot: () => clearCheckoutSnapshot(),
  buildPersistedSnapshot: (input: unknown) => buildPersistedSnapshot(input),
}));

import { createAppStore } from './store';
import { closeCheckout, openCheckout } from '@/features/checkout/checkoutSlice';

describe('createAppStore persistence wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadCheckoutSnapshot.mockReturnValue(null);
  });

  it('starts without preload when snapshot missing or closed', () => {
    // Arrange
    loadCheckoutSnapshot.mockReturnValue({ step: 'closed' });

    // Act
    const store = createAppStore();

    // Assert
    expect(store.getState().checkout.step).toBe('closed');
    expect(store.getState().checkout.customer.email).toBe('');
  });

  it('rehydrates checkout + selected product from snapshot', () => {
    // Arrange
    loadCheckoutSnapshot.mockReturnValue({
      step: 'summary',
      quantity: 1,
      customer: { email: 'a@b.co', fullName: 'Ada Buyer', phone: '' },
      delivery: {
        address: 'Calle 1',
        city: 'Bogotá',
        region: 'Cund',
        postalCode: '',
      },
      card: {
        brand: 'visa',
        lastFour: '4242',
        number: '',
        cvc: '',
        expMonth: '12',
        expYear: '30',
        cardHolder: 'Ada Buyer',
      },
      customerId: 'c1',
      deliveryId: 'd1',
      transactionId: null,
      transaction: null,
      payError: null,
      productSelectedId: 'prod-9',
    });

    // Act
    const store = createAppStore();

    // Assert
    expect(store.getState().checkout.step).toBe('summary');
    expect(store.getState().checkout.customer.email).toBe('a@b.co');
    expect(store.getState().product.selectedId).toBe('prod-9');
  });

  it('clears snapshot when checkout closes; saves while open', () => {
    // Arrange
    const store = createAppStore();

    // Act
    store.dispatch(openCheckout());

    // Assert
    expect(saveCheckoutSnapshot).toHaveBeenCalled();
    expect(clearCheckoutSnapshot).not.toHaveBeenCalled();

    // Act
    store.dispatch(closeCheckout());

    // Assert
    expect(clearCheckoutSnapshot).toHaveBeenCalled();
  });
});
