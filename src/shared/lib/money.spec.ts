import { describe, expect, it } from '@jest/globals';
import { injectAppEnv } from '@/shared/config/env';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formats COP amounts', () => {
    injectAppEnv({ VITE_CURRENCY: 'COP' });
    const formatted = formatMoney(249900);
    expect(formatted).toMatch(/249/);
    expect(formatted).toMatch(/\$|COP/);
  });

  it('falls back when currency code is invalid', () => {
    injectAppEnv({ VITE_CURRENCY: 'NOT_A_CURRENCY' });
    expect(formatMoney(10)).toMatch(/10/);
  });
});
