import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatQuantity, getAssetTypeIcon, cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('merges tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatCurrency', () => {
  it('formats number as EUR by default', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1,234.56');
  });

  it('formats string value', () => {
    const result = formatCurrency('999.99', 'USD');
    expect(result).toContain('999.99');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0.00');
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});

describe('formatQuantity', () => {
  it('returns dash for null', () => {
    expect(formatQuantity(null)).toBe('—');
  });

  it('formats whole numbers without decimals', () => {
    expect(formatQuantity(5)).toBe('5');
  });

  it('formats decimal numbers trimming trailing zeros', () => {
    const result = formatQuantity('1.50000000');
    expect(result).toBe('1.5');
  });

  it('preserves significant decimals', () => {
    const result = formatQuantity('0.00000001');
    expect(result).toBe('0.00000001');
  });
});

describe('getAssetTypeIcon', () => {
  it('returns icon for known types', () => {
    expect(getAssetTypeIcon('STOCKS')).toBe('📈');
    expect(getAssetTypeIcon('CRYPTO')).toBe('₿');
    expect(getAssetTypeIcon('REAL_ESTATE')).toBe('🏠');
  });

  it('returns fallback for unknown types', () => {
    expect(getAssetTypeIcon('UNKNOWN')).toBe('📦');
  });
});
