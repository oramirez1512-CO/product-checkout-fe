import { describe, expect, it } from '@jest/globals';
import { resolveFeesDisplay } from './fees';

describe('resolveFeesDisplay', () => {
  it('uses defaults when env empty', () => {
    // Act
    const fees = resolveFeesDisplay({});

    // Assert
    expect(fees).toEqual({
      baseFee: 3500,
      deliveryFee: 10000,
      currency: 'COP',
    });
  });

  it('reads display fees from env', () => {
    // Act
    const fees = resolveFeesDisplay({
      VITE_BASE_FEE: '100',
      VITE_DELIVERY_FEE: '200',
      VITE_CURRENCY: 'USD',
    });

    // Assert
    expect(fees).toEqual({
      baseFee: 100,
      deliveryFee: 200,
      currency: 'USD',
    });
  });

  it('falls back on non-numeric fee strings', () => {
    // Act
    const fees = resolveFeesDisplay({
      VITE_BASE_FEE: 'nope',
      VITE_DELIVERY_FEE: '',
    });

    // Assert
    expect(fees.baseFee).toBe(3500);
    expect(fees.deliveryFee).toBe(10000);
  });

  it('falls back when currency is blank', () => {
    // Arrange / Act / Assert
    expect(resolveFeesDisplay({ VITE_CURRENCY: '   ' }).currency).toBe('COP');
  });
});
