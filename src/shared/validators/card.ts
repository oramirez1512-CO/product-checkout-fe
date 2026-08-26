/** Digits only from a card / phone-like string. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Luhn check for card PANs (boundary: empty / short fail).
 * @see https://en.wikipedia.org/wiki/Luhn_algorithm
 */
export function isLuhnValid(pan: string): boolean {
  const digits = onlyDigits(pan);
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export type CardBrand = 'visa' | 'mastercard' | 'unknown';

/** Visa (4…) / Mastercard (51–55, 2221–2720). Plus for UI logos. */
export function detectCardBrand(pan: string): CardBrand {
  const digits = onlyDigits(pan);
  if (!digits) {
    return 'unknown';
  }
  if (digits.startsWith('4')) {
    return 'visa';
  }
  const two = Number(digits.slice(0, 2));
  if (two >= 51 && two <= 55) {
    return 'mastercard';
  }
  const four = Number(digits.slice(0, 4));
  if (four >= 2221 && four <= 2720) {
    return 'mastercard';
  }
  return 'unknown';
}

export function isValidCvc(cvc: string, brand: CardBrand = 'unknown'): boolean {
  const digits = onlyDigits(cvc);
  if (brand === 'mastercard' || brand === 'visa') {
    return digits.length === 3;
  }
  return digits.length === 3 || digits.length === 4;
}

export function isValidExpMonth(month: string): boolean {
  const n = Number(onlyDigits(month));
  return Number.isInteger(n) && n >= 1 && n <= 12;
}

/** Accepts YY or YYYY; must be current year or later (calendar month check separate). */
export function isValidExpYear(year: string, now = new Date()): boolean {
  const raw = onlyDigits(year);
  if (raw.length !== 2 && raw.length !== 4) {
    return false;
  }
  const full = raw.length === 2 ? 2000 + Number(raw) : Number(raw);
  if (!Number.isInteger(full) || full < 2000 || full > 2100) {
    return false;
  }
  return full >= now.getFullYear();
}

export function isExpiryInFuture(
  month: string,
  year: string,
  now = new Date(),
): boolean {
  if (!isValidExpMonth(month) || !isValidExpYear(year, now)) {
    return false;
  }
  const raw = onlyDigits(year);
  const fullYear = raw.length === 2 ? 2000 + Number(raw) : Number(raw);
  const expMonth = Number(onlyDigits(month));
  // Card valid through end of expiry month
  const expEnd = new Date(fullYear, expMonth, 0, 23, 59, 59, 999);
  return expEnd >= now;
}

export function formatCardNumberGroups(pan: string): string {
  const digits = onlyDigits(pan).slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function cardLastFour(pan: string): string {
  const digits = onlyDigits(pan);
  return digits.slice(-4);
}
