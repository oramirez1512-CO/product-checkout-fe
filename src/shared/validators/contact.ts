const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/** Optional phone: empty OK; otherwise 7–15 digits (E.164-ish without +). */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
