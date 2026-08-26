import { describe, expect, it } from '@jest/globals';
import { estimateCheckoutTotals, roundMoney } from './totals';

describe('estimateCheckoutTotals', () => {
  it('computes amount and total for happy path qty 1', () => {
    // Arrange
    const input = {
      unitPrice: 249900,
      quantity: 1,
      baseFee: 3500,
      deliveryFee: 10000,
    };

    // Act
    const totals = estimateCheckoutTotals(input);

    // Assert
    expect(totals.amount).toBe(249900);
    expect(totals.total).toBe(263400);
  });

  it('floors quantity to at least 1 (boundary)', () => {
    // Arrange / Act
    const zero = estimateCheckoutTotals({
      unitPrice: 100,
      quantity: 0,
      baseFee: 0,
      deliveryFee: 0,
    });
    const negative = estimateCheckoutTotals({
      unitPrice: 100,
      quantity: -3,
      baseFee: 0,
      deliveryFee: 0,
    });

    // Assert
    expect(zero.quantity).toBe(1);
    expect(negative.quantity).toBe(1);
  });

  it('multiplies unit price by quantity', () => {
    // Arrange / Act
    const totals = estimateCheckoutTotals({
      unitPrice: 1000.555,
      quantity: 2,
      baseFee: 1.005,
      deliveryFee: 2.004,
    });

    // Assert
    expect(totals.unitPrice).toBe(roundMoney(1000.555));
    expect(totals.amount).toBe(roundMoney(totals.unitPrice * 2));
    expect(totals.total).toBe(
      roundMoney(totals.amount + totals.baseFee + totals.deliveryFee),
    );
  });
});
