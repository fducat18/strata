import { describe, it, expect } from 'vitest';
import { getAssetTypeIcon } from '../assetTypeIcon';

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
