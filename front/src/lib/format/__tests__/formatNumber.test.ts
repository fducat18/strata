import { describe, it, expect } from 'vitest';
import { formatQuantity } from '../formatNumber';

describe('formatQuantity', () => {
  it('returns dash for null/undefined/empty', () => {
    expect(formatQuantity(null)).toBe('—');
    expect(formatQuantity(undefined)).toBe('—');
    expect(formatQuantity('')).toBe('—');
  });

  it('formats whole numbers without decimals', () => {
    expect(formatQuantity(5)).toBe('5');
  });

  it('trims trailing zeros', () => {
    expect(formatQuantity('1.50000000')).toBe('1.5');
  });

  it('preserves significant decimals', () => {
    expect(formatQuantity('0.00000001')).toBe('0.00000001');
  });

  it('handles negative numbers', () => {
    expect(formatQuantity('-1.25')).toBe('-1.25');
  });
});
