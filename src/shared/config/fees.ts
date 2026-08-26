export const DEFAULT_BASE_FEE = 3500.0;
export const DEFAULT_DELIVERY_FEE = 10000.0;
export const DEFAULT_CURRENCY = 'COP';

export type FeesDisplayConfig = {
  baseFee: number;
  deliveryFee: number;
  currency: string;
};

export type FeeEnvBag = {
  VITE_BASE_FEE?: string;
  VITE_DELIVERY_FEE?: string;
  VITE_CURRENCY?: string;
};

function parseFee(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Display defaults only — backend recalculates totals. */
export function resolveFeesDisplay(env: FeeEnvBag = {}): FeesDisplayConfig {
  return {
    baseFee: parseFee(env.VITE_BASE_FEE, DEFAULT_BASE_FEE),
    deliveryFee: parseFee(env.VITE_DELIVERY_FEE, DEFAULT_DELIVERY_FEE),
    currency: env.VITE_CURRENCY?.trim() || DEFAULT_CURRENCY,
  };
}
