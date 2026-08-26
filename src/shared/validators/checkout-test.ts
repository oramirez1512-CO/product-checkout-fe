import { describe, expect, it } from '@jest/globals';
import {
  hasCheckoutErrors,
  isValidCardHolder,
  MIN_CARD_HOLDER_LENGTH,
  validateCardDraft,
  validateCheckoutDraft,
  validateCustomerDraft,
} from './checkout';
import { isValidEmail, isValidPhone, normalizeEmail } from './contact';
import { validateDeliveryDraft } from './delivery';

const futureYear = String(new Date().getFullYear() + 2);

const validDraft = () => ({
  customer: {
    email: 'Ada@Example.com',
    fullName: 'Ada Buyer',
    phone: '3001234567',
  },
  delivery: {
    address: 'Calle 1 #2-3',
    city: 'Bogotá',
    region: 'Cundinamarca',
    postalCode: '110111',
  },
  card: {
    number: '4242424242424242',
    cvc: '123',
    expMonth: '12',
    expYear: futureYear,
    cardHolder: 'Ada Buyer',
  },
});

describe('contact validators', () => {
  it('email happy / invalid boundaries', () => {
    // Arrange / Act / Assert
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(normalizeEmail(' Ada@X.CO ')).toBe('ada@x.co');
  });

  it('phone optional empty; digit length 7–15', () => {
    // Arrange / Act / Assert
    expect(isValidPhone('')).toBe(true);
    expect(isValidPhone('1234567')).toBe(true);
    expect(isValidPhone('123456789012345')).toBe(true);
    expect(isValidPhone('123456')).toBe(false);
    expect(isValidPhone('1234567890123456')).toBe(false);
  });
});

describe('delivery / checkout validate', () => {
  it('requires address city region', () => {
    // Act
    const errors = validateDeliveryDraft({
      address: '',
      city: '',
      region: '',
      postalCode: '',
    });

    // Assert
    expect(errors.address).toBeTruthy();
    expect(errors.city).toBeTruthy();
    expect(errors.region).toBeTruthy();
  });

  it('rejects oversized postal code', () => {
    // Act
    const errors = validateDeliveryDraft({
      address: 'a',
      city: 'b',
      region: 'c',
      postalCode: 'x'.repeat(21),
    });

    // Assert
    expect(errors.postalCode).toBeTruthy();
  });

  it('customer email required shape', () => {
    // Arrange / Act / Assert
    expect(validateCustomerDraft({ email: '', fullName: '', phone: '' }).email).toBeTruthy();
  });

  it('full draft passes when valid', () => {
    // Act
    const errors = validateCheckoutDraft(validDraft());

    // Assert
    expect(hasCheckoutErrors(errors)).toBe(false);
  });

  it('rejects non Visa/MC even if Luhn-ish path unknown', () => {
    // Arrange
    const draft = validDraft();
    draft.card.number = '6011111111111117'; // discover-ish Luhn often valid

    // Act
    const errors = validateCheckoutDraft(draft);

    // Assert
    expect(errors.card.number).toMatch(/Visa|Mastercard/i);
  });

  it('cardHolder min length matches provider (boundary 4 vs 5)', () => {
    // Arrange / Act / Assert
    expect(MIN_CARD_HOLDER_LENGTH).toBe(5);
    expect(isValidCardHolder('Ada')).toBe(false);
    expect(isValidCardHolder('Adas')).toBe(false);
    expect(isValidCardHolder('Ada B')).toBe(true);
    expect(isValidCardHolder('Ada Buyer')).toBe(true);

    const short = validDraft();
    short.card.cardHolder = 'Ada';
    expect(validateCardDraft(short.card).cardHolder).toMatch(/at least 5/i);

    const exact = validDraft();
    exact.card.cardHolder = 'Adasx';
    expect(validateCardDraft(exact.card).cardHolder).toBeUndefined();
  });

  it('rejects CVC with non-digits; requires 3 for Visa/MC', () => {
    // Arrange
    const letters = validDraft();
    letters.card.cvc = '12a';

    // Act / Assert
    expect(validateCardDraft(letters.card).cvc).toMatch(/digits only/i);

    const short = validDraft();
    short.card.cvc = '12';
    expect(validateCardDraft(short.card).cvc).toMatch(/3 digits/i);
  });

  it('rejects month outside 01–12', () => {
    // Arrange
    const draft = validDraft();
    draft.card.expMonth = '13';

    // Act / Assert
    expect(validateCardDraft(draft.card).expMonth).toMatch(/01–12/);
  });
});
