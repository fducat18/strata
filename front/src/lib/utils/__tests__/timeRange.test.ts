import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSinceDate, TIME_RANGES, type TimeRange } from '../timeRange.js';

describe('getSinceDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix now to 2026-07-17 12:00:00 UTC for predictable tests
    vi.setSystemTime(new Date('2026-07-17T12:00:00Z'));
  });

  it('returns undefined for ALL', () => {
    expect(getSinceDate('ALL')).toBeUndefined();
  });

  it('returns 1 day ago for 1D', () => {
    const result = getSinceDate('1D');
    expect(result).toEqual(new Date('2026-07-16T12:00:00Z'));
  });

  it('returns 7 days ago for 7D', () => {
    const result = getSinceDate('7D');
    expect(result).toEqual(new Date('2026-07-10T12:00:00Z'));
  });

  it('returns 1 month ago for 1M', () => {
    const result = getSinceDate('1M');
    expect(result).toEqual(new Date('2026-06-17T12:00:00Z'));
  });

  it('returns 3 months ago for 3M', () => {
    const result = getSinceDate('3M');
    expect(result).toEqual(new Date('2026-04-17T12:00:00Z'));
  });

  it('returns 1 year ago for 1Y', () => {
    const result = getSinceDate('1Y');
    expect(result).toEqual(new Date('2025-07-17T12:00:00Z'));
  });

  it('returns Jan 1 of current year for YTD', () => {
    const result = getSinceDate('YTD');
    expect(result).toEqual(new Date(2026, 0, 1));
  });
});

describe('TIME_RANGES', () => {
  it('exports all expected time ranges', () => {
    expect(TIME_RANGES).toEqual(['1D', '7D', '1M', '3M', 'YTD', '1Y', 'ALL']);
  });
});
