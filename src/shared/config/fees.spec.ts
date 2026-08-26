import { describe, expect, it } from '@jest/globals';
import { resolveFeesDisplay } from './fees';

describe('resolveFeesDisplay', () => {
  it('uses defaults when env empty', () => {
    const fees = resolveFeesDisplay({});
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

  it('falls back on non-numeric fee strings', () => {
    const fees = resolveFeesDisplay({
      VITE_BASE_FEE: 'nope',
      VITE_DELIVERY_FEE: '',
    });
    expect(fees.baseFee).toBe(3500);
    expect(fees.deliveryFee).toBe(10000);
  });

  it('falls back when currency is blank', () => {
    expect(resolveFeesDisplay({ VITE_CURRENCY: '   ' }).currency).toBe('COP');
  });
});
