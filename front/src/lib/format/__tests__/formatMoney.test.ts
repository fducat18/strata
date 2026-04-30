import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { formatMoney, toDecimal } from '../formatMoney';

describe('toDecimal', () => {
  it('parses string', () => {
    expect(toDecimal('1234.56')?.toString()).toBe('1234.56');
  });

  it('handles null/undefined/empty', () => {
    expect(toDecimal(null)).toBeNull();
    expect(toDecimal(undefined)).toBeNull();
    expect(toDecimal('')).toBeNull();
  });

  it('preserves precision beyond Number for big values', () => {
    const big = '9999999999999999.12345678';
    const dec = toDecimal(big);
    expect(dec).toBeInstanceOf(Decimal);
    expect(dec!.toFixed(8)).toBe(big);
  });
});

describe('formatMoney', () => {
  it('formats EUR by default', () => {
    expect(formatMoney(1234.56)).toContain('1,234.56');
  });

  it('formats string value with USD', () => {
    expect(formatMoney('999.99', { currency: 'USD' })).toContain('999.99');
  });

  it('returns dash for null/undefined', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
  });

  it('handles zero', () => {
    expect(formatMoney(0)).toContain('0.00');
  });

  it('respects custom locale', () => {
    const out = formatMoney('1234.56', { locale: 'fr-FR', currency: 'EUR' });
    expect(out).toMatch(/1[\s\u202f]234,56/);
  });
});
