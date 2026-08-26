/** Display-side money rounding (2 dp). Backend recalculates the real total. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export type CheckoutTotalsInput = {
  unitPrice: number;
  quantity: number;
  baseFee: number;
  deliveryFee: number;
};

export type CheckoutTotals = {
  quantity: number;
  unitPrice: number;
  /** product line: unitPrice × quantity */
  amount: number;
  baseFee: number;
  deliveryFee: number;
  total: number;
};

export function estimateCheckoutTotals(
  input: CheckoutTotalsInput,
): CheckoutTotals {
  const quantity = Math.max(1, Math.floor(input.quantity) || 1);
  const unitPrice = roundMoney(input.unitPrice);
  const amount = roundMoney(unitPrice * quantity);
  const baseFee = roundMoney(input.baseFee);
  const deliveryFee = roundMoney(input.deliveryFee);
  const total = roundMoney(amount + baseFee + deliveryFee);
  return { quantity, unitPrice, amount, baseFee, deliveryFee, total };
}
