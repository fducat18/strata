import { describe, it, expect } from 'vitest';
import { cn } from '../index';

describe('utils/index barrel', () => {
  it('exports cn', () => {
    expect(cn).toBeDefined();
  });
  it('cn merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });
  it('cn handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });
  it('cn handles undefined', () => {
    expect(cn('foo', undefined)).toBe('foo');
  });
});
