import {
  detectCardBrand,
  isExpiryInFuture,
  isLuhnValid,
  isValidCvc,
  isValidExpMonth,
  onlyDigits,
  type CardBrand,
} from './card';
import { isNonEmpty, isValidEmail, isValidPhone } from './contact';
import { validateDeliveryDraft, type DeliveryDraft } from './delivery';

/** Sandbox payment provider rejects card_holder shorter than 5. */
export const MIN_CARD_HOLDER_LENGTH = 5;

export type CustomerDraft = {
  email: string;
  fullName: string;
  phone: string;
};

export type CardDraft = {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
};

export type CheckoutDraft = {
  customer: CustomerDraft;
  delivery: DeliveryDraft;
  card: CardDraft;
};

export type CheckoutFieldErrors = {
  customer: Partial<Record<keyof CustomerDraft, string>>;
  delivery: Partial<Record<keyof DeliveryDraft, string>>;
  card: Partial<Record<keyof CardDraft, string>>;
};

export function isValidCardHolder(value: string): boolean {
  return value.trim().length >= MIN_CARD_HOLDER_LENGTH;
}

export function validateCustomerDraft(
  draft: CustomerDraft,
): Partial<Record<keyof CustomerDraft, string>> {
  const errors: Partial<Record<keyof CustomerDraft, string>> = {};
  if (!isNonEmpty(draft.fullName)) {
    errors.fullName = 'Full name is required';
  }
  if (!isValidEmail(draft.email)) {
    errors.email = 'Enter a valid email';
  }
  if (!isValidPhone(draft.phone)) {
    errors.phone = 'Phone must have 7–15 digits';
  }
  return errors;
}

export function validateCardDraft(
  draft: CardDraft,
  now = new Date(),
): Partial<Record<keyof CardDraft, string>> {
  const errors: Partial<Record<keyof CardDraft, string>> = {};
  const brand = detectCardBrand(draft.number);

  if (!isLuhnValid(draft.number)) {
    errors.number = 'Card number is invalid';
  } else if (brand === 'unknown') {
    errors.number = 'Only Visa or Mastercard are accepted';
  }

  if (!isNonEmpty(draft.cardHolder)) {
    errors.cardHolder = 'Cardholder name is required';
  } else if (!isValidCardHolder(draft.cardHolder)) {
    errors.cardHolder = `Cardholder must be at least ${MIN_CARD_HOLDER_LENGTH} characters`;
  }

  if (!isValidExpMonth(draft.expMonth)) {
    errors.expMonth = 'Month must be 01–12 (2 digits)';
  }

  const yearDigits = onlyDigits(draft.expYear);
  if (yearDigits.length !== 2 && yearDigits.length !== 4) {
    errors.expYear = 'Use YY or YYYY';
  } else if (!isExpiryInFuture(draft.expMonth, draft.expYear, now)) {
    errors.expYear = 'Card is expired';
  }

  const cvcDigits = onlyDigits(draft.cvc);
  if (cvcDigits !== draft.cvc.trim()) {
    errors.cvc = 'CVC must be digits only';
  } else if (!isValidCvc(draft.cvc, brand)) {
    errors.cvc = brand === 'visa' || brand === 'mastercard'
      ? 'CVC must be 3 digits'
      : 'CVC must be 3 or 4 digits';
  }

  return errors;
}

export function validateCheckoutDraft(
  draft: CheckoutDraft,
  now = new Date(),
): CheckoutFieldErrors {
  return {
    customer: validateCustomerDraft(draft.customer),
    delivery: validateDeliveryDraft(draft.delivery),
    card: validateCardDraft(draft.card, now),
  };
}

export function hasCheckoutErrors(errors: CheckoutFieldErrors): boolean {
  return (
    Object.keys(errors.customer).length > 0 ||
    Object.keys(errors.delivery).length > 0 ||
    Object.keys(errors.card).length > 0
  );
}

export function cardBrandLabel(brand: CardBrand): string {
  if (brand === 'visa') {
    return 'Visa';
  }
  if (brand === 'mastercard') {
    return 'Mastercard';
  }
  return '';
}
