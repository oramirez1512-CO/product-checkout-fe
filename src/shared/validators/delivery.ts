import { isNonEmpty } from './contact';

export type DeliveryDraft = {
  address: string;
  city: string;
  region: string;
  postalCode: string;
};

export function isValidPostalCode(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  return trimmed.length <= 20;
}

export function validateDeliveryDraft(draft: DeliveryDraft): Partial<
  Record<keyof DeliveryDraft, string>
> {
  const errors: Partial<Record<keyof DeliveryDraft, string>> = {};
  if (!isNonEmpty(draft.address)) {
    errors.address = 'Address is required';
  }
  if (!isNonEmpty(draft.city)) {
    errors.city = 'City is required';
  }
  if (!isNonEmpty(draft.region)) {
    errors.region = 'Region is required';
  }
  if (!isValidPostalCode(draft.postalCode)) {
    errors.postalCode = 'Postal code is too long';
  }
  return errors;
}
