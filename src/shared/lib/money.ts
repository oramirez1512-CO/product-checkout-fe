import { getAppEnv } from '@/shared/config/env';

export function formatMoney(amount: number, currency?: string): string {
  const resolved = currency ?? getAppEnv().fees.currency;
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: resolved,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${resolved}`;
  }
}
