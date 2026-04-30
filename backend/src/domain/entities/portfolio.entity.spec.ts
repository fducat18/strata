import { Decimal } from 'decimal.js';
import { Portfolio } from './portfolio.entity.js';
import { Asset } from './asset.entity.js';
import { AssetSnapshot } from './asset-snapshot.entity.js';

describe('Portfolio', () => {
  function makePortfolio(assets: Asset[] = []): Portfolio {
    return new Portfolio(
      'p1',
      'Test Portfolio',
      'EUR',
      new Date('2024-01-01'),
      new Date('2024-01-01'),
      assets,
    );
  }

  function makeAssetWithSnapshot(id: string, value: string): Asset {
    const snapshot = new AssetSnapshot(
      `snap-${id}`,
      id,
      new Decimal(value),
      new Date('2024-06-01'),
      new Date('2024-06-01'),
    );
    return new Asset(
      id,
      `Asset ${id}`,
      new Decimal('1'),
      false,
      'p1',
      'at1',
      new Date('2024-01-01'),
      new Date('2024-01-01'),
      null,
      null,
      [snapshot],
    );
  }

  describe('totalValue()', () => {
    it('returns 0 when no assets', () => {
      const portfolio = makePortfolio([]);
      expect(portfolio.totalValue().equals(new Decimal(0))).toBe(true);
    });

    it('sums latest snapshot values across assets', () => {
      const asset1 = makeAssetWithSnapshot('a1', '100.50');
      const asset2 = makeAssetWithSnapshot('a2', '200.25');
      const portfolio = makePortfolio([asset1, asset2]);
      expect(portfolio.totalValue().equals(new Decimal('300.75'))).toBe(true);
    });

    it('skips assets with no snapshots', () => {
      const assetWithSnapshot = makeAssetWithSnapshot('a1', '500');
      const assetWithoutSnapshot = new Asset(
        'a2',
        'No Snapshot',
        new Decimal('1'),
        false,
        'p1',
        'at1',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
        null,
        null,
        [],
      );
      const portfolio = makePortfolio([
        assetWithSnapshot,
        assetWithoutSnapshot,
      ]);
      expect(portfolio.totalValue().equals(new Decimal('500'))).toBe(true);
    });
  });
});
