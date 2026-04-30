import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from '../formatDate';

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const out = formatDate('2024-01-15T10:30:00Z');
    expect(out).toContain('Jan');
    expect(out).toContain('15');
    expect(out).toContain('2024');
  });
});

describe('formatDateTime', () => {
  it('includes year', () => {
    const out = formatDateTime('2024-01-15T10:30:00Z');
    expect(out).toMatch(/2024/);
  });
});
