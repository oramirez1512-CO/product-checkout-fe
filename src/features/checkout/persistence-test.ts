import { describe, expect, it } from '@jest/globals';
import {
  buildPersistedSnapshot,
  clearCheckoutSnapshot,
  CHECKOUT_STORAGE_KEY,
  loadCheckoutSnapshot,
  normalizeRehydratedStep,
  parsePersistedSnapshot,
  saveCheckoutSnapshot,
} from './persistence';
import type { CheckoutCardMeta } from './types';

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    map,
  };
}

const card: CheckoutCardMeta = {
  brand: 'visa',
  lastFour: '4242',
  number: '4242424242424242',
  cvc: '123',
  expMonth: '12',
  expYear: '2030',
  cardHolder: 'Ada',
};

describe('checkout persistence', () => {
  it('normalizeRehydratedStep maps paying → summary', () => {
    // Arrange / Act / Assert
    expect(normalizeRehydratedStep('paying')).toBe('summary');
    expect(normalizeRehydratedStep('result')).toBe('result');
    expect(normalizeRehydratedStep('form')).toBe('form');
  });

  it('buildPersistedSnapshot strips PAN and CVC', () => {
    // Arrange / Act
    const snapshot = buildPersistedSnapshot({
      step: 'summary',
      quantity: 1,
      customer: { email: 'a@b.co', fullName: 'Ada', phone: '' },
      delivery: {
        address: 'x',
        city: 'y',
        region: 'z',
        postalCode: '',
      },
      card,
      customerId: 'c1',
      deliveryId: 'd1',
      transactionId: null,
      transaction: null,
      payError: null,
      productSelectedId: 'p1',
    });

    // Assert
    expect(snapshot.card).toEqual({
      brand: 'visa',
      lastFour: '4242',
      expMonth: '12',
      expYear: '2030',
      cardHolder: 'Ada',
    });
    expect(JSON.stringify(snapshot)).not.toMatch(/4242424242424242/);
    expect(JSON.stringify(snapshot)).not.toMatch(/"cvc"/);
  });

  it('parsePersistedSnapshot restores empty number/cvc', () => {
    // Arrange
    const snapshot = buildPersistedSnapshot({
      step: 'paying',
      quantity: 1,
      customer: { email: 'a@b.co', fullName: 'Ada', phone: '' },
      delivery: {
        address: 'x',
        city: 'y',
        region: 'z',
        postalCode: '',
      },
      card,
      customerId: null,
      deliveryId: null,
      transactionId: null,
      transaction: null,
      payError: null,
      productSelectedId: 'p1',
    });

    // Act
    const loaded = parsePersistedSnapshot(snapshot);

    // Assert
    expect(loaded?.step).toBe('summary');
    expect(loaded?.card.number).toBe('');
    expect(loaded?.card.cvc).toBe('');
    expect(loaded?.card.lastFour).toBe('4242');
    expect(loaded?.productSelectedId).toBe('p1');
  });

  it('rejects invalid payloads', () => {
    // Arrange / Act / Assert
    expect(parsePersistedSnapshot(null)).toBeNull();
    expect(parsePersistedSnapshot({ version: 2, step: 'form' })).toBeNull();
    expect(parsePersistedSnapshot({ version: 1, step: 'nope' })).toBeNull();
  });

  it('save/load/clear round-trip via storage', () => {
    // Arrange
    const storage = memoryStorage();
    const snapshot = buildPersistedSnapshot({
      step: 'form',
      quantity: 1,
      customer: { email: 'a@b.co', fullName: 'Ada', phone: '' },
      delivery: {
        address: 'x',
        city: 'y',
        region: 'z',
        postalCode: '',
      },
      card,
      customerId: null,
      deliveryId: null,
      transactionId: null,
      transaction: null,
      payError: null,
      productSelectedId: null,
    });

    // Act
    saveCheckoutSnapshot(snapshot, storage);
    const loaded = loadCheckoutSnapshot(storage);

    // Assert
    expect(storage.map.has(CHECKOUT_STORAGE_KEY)).toBe(true);
    expect(loaded?.customer.email).toBe('a@b.co');
    expect(loaded?.card.number).toBe('');

    // Act
    clearCheckoutSnapshot(storage);

    // Assert
    expect(loadCheckoutSnapshot(storage)).toBeNull();
  });

  it('loadCheckoutSnapshot returns null on bad JSON', () => {
    // Arrange
    const storage = memoryStorage({ [CHECKOUT_STORAGE_KEY]: '{not-json' });

    // Act / Assert
    expect(loadCheckoutSnapshot(storage)).toBeNull();
  });
});
