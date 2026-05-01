import { describe, it, expect } from 'vitest';
import * as apiBarrel from '../index';

describe('lib/api barrel exports', () => {
  it('exports getPortfolioSnapshots', () => {
    expect(apiBarrel.getPortfolioSnapshots).toBeDefined();
  });
  it('exports assetApi', () => {
    expect(apiBarrel.assetApi).toBeDefined();
  });
  it('exports tagApi', () => {
    expect(apiBarrel.tagApi).toBeDefined();
  });
  it('exports categoryApi', () => {
    expect(apiBarrel.categoryApi).toBeDefined();
  });
  it('exports assetTypeApi', () => {
    expect(apiBarrel.assetTypeApi).toBeDefined();
  });
  it('exports backupApi', () => {
    expect(apiBarrel.backupApi).toBeDefined();
  });
  it('exports api (axios instance)', () => {
    expect(apiBarrel.api).toBeDefined();
  });
});
