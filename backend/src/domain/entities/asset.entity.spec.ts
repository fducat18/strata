import { Decimal } from 'decimal.js';
import { Asset } from './asset.entity.js';
import { AssetSnapshot } from './asset-snapshot.entity.js';

describe('Asset', () => {
  const base = {
    id: 'a1',
    name: 'Test Asset',
    quantity: new Decimal('10'),
    disposed: false,
    portfolioId: 'p1',
    assetTypeId: 'at1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  function makeAsset(overrides: Partial<ConstructorParameters<typeof Asset>> extends never ? never : Record<string, unknown> = {}, snapshots: AssetSnapshot[] = []): Asset {
    return new Asset(
      base.id,
      base.name,
      base.quantity,
      overrides.disposed !== undefined ? overrides.disposed as boolean : base.disposed,
      base.portfolioId,
      base.assetTypeId,
      base.createdAt,
      base.updatedAt,
      null,
      null,
      snapshots,
    );
  }

  describe('currentValue()', () => {
    it('returns null when no snapshots', () => {
      const asset = makeAsset({}, []);
      expect(asset.currentValue()).toBeNull();
    });

    it('returns latest snapshot value by observedAt date', () => {
      const snapshots: AssetSnapshot[] = [
        new AssetSnapshot('s1', 'a1', new Decimal('100'), new Date('2024-01-01'), new Date('2024-01-01')),
        new AssetSnapshot('s2', 'a1', new Decimal('250'), new Date('2024-06-01'), new Date('2024-06-01')),
        new AssetSnapshot('s3', 'a1', new Decimal('150'), new Date('2024-03-01'), new Date('2024-03-01')),
      ];
      const asset = makeAsset({}, snapshots);
      expect(asset.currentValue()!.equals(new Decimal('250'))).toBe(true);
    });

    it('returns the single snapshot value when only one exists', () => {
      const snapshots = [
        new AssetSnapshot('s1', 'a1', new Decimal('42.50'), new Date('2024-01-15'), new Date('2024-01-15')),
      ];
      const asset = makeAsset({}, snapshots);
      expect(asset.currentValue()!.equals(new Decimal('42.50'))).toBe(true);
    });
  });

  describe('dispose()', () => {
    it('returns a new Asset with disposed=true', () => {
      const asset = makeAsset({ disposed: false });
      const disposed = asset.dispose();
      expect(disposed.isDisposed()).toBe(true);
      expect(disposed).not.toBe(asset);
      expect(disposed.id).toBe(asset.id);
      expect(disposed.name).toBe(asset.name);
    });
  });

  describe('isDisposed()', () => {
    it('returns false for non-disposed asset', () => {
      const asset = makeAsset({ disposed: false });
      expect(asset.isDisposed()).toBe(false);
    });

    it('returns true for disposed asset', () => {
      const asset = makeAsset({ disposed: true });
      expect(asset.isDisposed()).toBe(true);
    });
  });
});
