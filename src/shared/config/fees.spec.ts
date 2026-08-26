import { describe, expect, it } from '@jest/globals';
import { resolveFeesDisplay } from './fees';

describe('resolveFeesDisplay', () => {
  it('uses defaults when env empty', () => {
    // Arrange / Act
    const fees = resolveFeesDisplay({});

    // Assert
    expect(fees).toEqual({
      baseFee: 3500,
      deliveryFee: 10000,
      currency: 'COP',
    });
  });

  it('reads display fees from env', () => {
    const fees = resolveFeesDisplay({
      VITE_BASE_FEE: '100',
      VITE_DELIVERY_FEE: '200',
      VITE_CURRENCY: 'USD',
    });
    expect(fees).toEqual({
      baseFee: 100,
      deliveryFee: 200,
      currency: 'USD',
    });
  });
});
