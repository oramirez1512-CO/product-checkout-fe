import { describe, expect, it } from '@jest/globals';
import {
  detectCardBrand,
  formatCardNumberGroups,
  isExpiryInFuture,
  isLuhnValid,
  isValidCvc,
  isValidExpMonth,
  isValidExpYear,
  onlyDigits,
} from './card';

describe('card validators', () => {
  describe('isLuhnValid', () => {
    it('accepts well-known Visa test PAN (happy)', () => {
      // Arrange / Act / Assert
      expect(isLuhnValid('4242424242424242')).toBe(true);
    });

    it('accepts Mastercard test PAN', () => {
      // Arrange / Act / Assert
      expect(isLuhnValid('5555555555554444')).toBe(true);
    });

    it('rejects below min length (12 digits)', () => {
      // Arrange / Act / Assert
      expect(isLuhnValid('424242424242')).toBe(false);
    });

    it('rejects above max length (20 digits)', () => {
      // Arrange / Act / Assert
      expect(isLuhnValid('42424242424242424242')).toBe(false);
    });

    it('rejects bad checksum', () => {
      // Arrange / Act / Assert
      expect(isLuhnValid('4242424242424241')).toBe(false);
    });
  });

  describe('detectCardBrand', () => {
    it('detects Visa', () => {
      // Arrange / Act / Assert
      expect(detectCardBrand('4')).toBe('visa');
    });

    it('detects Mastercard classic range', () => {
      // Arrange / Act / Assert
      expect(detectCardBrand('51')).toBe('mastercard');
      expect(detectCardBrand('55')).toBe('mastercard');
    });

    it('detects Mastercard 2-series', () => {
      // Arrange / Act / Assert
      expect(detectCardBrand('2221')).toBe('mastercard');
      expect(detectCardBrand('2720')).toBe('mastercard');
    });

    it('returns unknown outside Visa/MC', () => {
      // Arrange / Act / Assert
      expect(detectCardBrand('6011')).toBe('unknown');
      expect(detectCardBrand('')).toBe('unknown');
    });
  });

  describe('expiry and cvc boundaries', () => {
    const now = new Date(2026, 7, 26); // Aug 26, 2026

    it('month min/max', () => {
      // Arrange / Act / Assert
      expect(isValidExpMonth('1')).toBe(true);
      expect(isValidExpMonth('12')).toBe(true);
      expect(isValidExpMonth('0')).toBe(false);
      expect(isValidExpMonth('13')).toBe(false);
    });

    it('year YY/YYYY and past year', () => {
      // Arrange / Act / Assert
      expect(isValidExpYear('26', now)).toBe(true);
      expect(isValidExpYear('2026', now)).toBe(true);
      expect(isValidExpYear('25', now)).toBe(false);
      expect(isValidExpYear('2', now)).toBe(false);
    });

    it('expiry through end of month', () => {
      // Arrange / Act / Assert
      expect(isExpiryInFuture('08', '2026', now)).toBe(true);
      expect(isExpiryInFuture('07', '2026', now)).toBe(false);
    });

    it('cvc length 3 (Visa/MC) vs 3–4 unknown', () => {
      // Arrange / Act / Assert
      expect(isValidCvc('123', 'visa')).toBe(true);
      expect(isValidCvc('12', 'visa')).toBe(false);
      expect(isValidCvc('1234', 'visa')).toBe(false);
      expect(isValidCvc('1234', 'unknown')).toBe(true);
    });
  });

  it('formats and strips digits', () => {
    // Arrange / Act / Assert
    expect(onlyDigits('42 42')).toBe('4242');
    expect(formatCardNumberGroups('4242424242424242')).toBe(
      '4242 4242 4242 4242',
    );
  });
});
