import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { AssetController } from './asset.controller.js';
import {
  AssetService,
  AssetSnapshotService,
} from '../../application/services/index.js';
import { Asset } from '../../domain/entities/asset.entity.js';
import { AssetSnapshot } from '../../domain/entities/asset-snapshot.entity.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';
import { Category } from '../../domain/entities/category.entity.js';
import { Tag } from '../../domain/entities/tag.entity.js';

describe('AssetController', () => {
  let controller: AssetController;
  let assetService: jest.Mocked<AssetService>;
  let assetSnapshotService: jest.Mocked<AssetSnapshotService>;

  const now = new Date('2024-01-01T00:00:00.000Z');
  const sampleAssetType = new AssetType('at1', 'STOCKS', 'Stocks', 'FINANCIAL');
  const sampleAsset = new Asset(
    'a1',
    'My Asset',
    new Decimal('10'),
    false,
    'at1',
    now,
    now,
    sampleAssetType,
  );
  const sampleSnapshot = new AssetSnapshot(
    's1',
    'a1',
    new Decimal('1000'),
    now,
    now,
  );

  beforeEach(async () => {
    const mockAssetService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      dispose: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
      addCategory: jest.fn(),
      removeCategory: jest.fn(),
    };

    const mockAssetSnapshotService = {
      create: jest.fn(),
      findByAsset: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetController],
      providers: [
        { provide: AssetService, useValue: mockAssetService },
        { provide: AssetSnapshotService, useValue: mockAssetSnapshotService },
      ],
    }).compile();

    controller = module.get<AssetController>(AssetController);
    assetService = module.get(AssetService);
    assetSnapshotService = module.get(AssetSnapshotService);
  });

  describe('create', () => {
    it('calls assetService.create with dto fields and returns mapped response', async () => {
      assetService.create.mockResolvedValue(sampleAsset);
      const dto = {
        name: 'My Asset',
        assetTypeId: 'at1',
        quantity: '10',
      };
      const result = await controller.create(dto as any);
      expect(assetService.create).toHaveBeenCalledWith({
        name: 'My Asset',
        assetTypeId: 'at1',
        quantity: '10',
      });
      expect(result.id).toBe('a1');
      expect(result.name).toBe('My Asset');
    });
  });

  describe('findAll', () => {
    it('returns all assets', async () => {
      assetService.findAll.mockResolvedValue([sampleAsset]);
      const result = await controller.findAll();
      expect(assetService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('includes currentValue in response (null when no snapshots)', async () => {
      assetService.findAll.mockResolvedValue([sampleAsset]);
      const result = await controller.findAll();
      expect(result[0]).toHaveProperty('currentValue');
      expect(result[0].currentValue).toBeNull();
    });

    it('includes currentValue in response (set when snapshots exist)', async () => {
      const assetWithSnapshots = new Asset(
        'a1',
        'My Asset',
        new Decimal('10'),
        false,
        'at1',
        now,
        now,
        sampleAssetType,
        [sampleSnapshot], // snapshots (9th param)
        [], // transactions
        [], // categories
        [], // tags
      );
      assetService.findAll.mockResolvedValue([assetWithSnapshots]);
      const result = await controller.findAll();
      expect(result[0]).toHaveProperty('currentValue');
      expect(result[0].currentValue).toBe('1000');
    });
  });

  describe('findById', () => {
    it('returns mapped asset', async () => {
      assetService.findById.mockResolvedValue(sampleAsset);
      const result = await controller.findById('a1');
      expect(assetService.findById).toHaveBeenCalledWith('a1');
      expect(result.id).toBe('a1');
    });
  });

  describe('update', () => {
    it('calls assetService.update and returns mapped response', async () => {
      assetService.update.mockResolvedValue(sampleAsset);
      const dto = { name: 'Updated', quantity: '20', assetTypeId: 'at1' };
      const result = await controller.update('a1', dto as any);
      expect(assetService.update).toHaveBeenCalledWith('a1', {
        name: 'Updated',
        quantity: '20',
        assetTypeId: 'at1',
      });
      expect(result.id).toBe('a1');
    });
  });

  describe('delete', () => {
    it('calls assetService.delete', async () => {
      assetService.delete.mockResolvedValue(undefined);
      await controller.delete('a1');
      expect(assetService.delete).toHaveBeenCalledWith('a1');
    });
  });

  describe('dispose', () => {
    it('calls assetService.dispose with id and dto fields, returns mapped response', async () => {
      const disposedAsset = sampleAsset.dispose();
      assetService.dispose.mockResolvedValue(disposedAsset);
      const dto = { disposalDate: '2025-06-01', disposalPrice: '5000.00' };
      const result = await controller.dispose('a1', dto as any);
      expect(assetService.dispose).toHaveBeenCalledWith('a1', '2025-06-01', '5000.00');
      expect(result.disposed).toBe(true);
    });
  });

  describe('getSnapshots', () => {
    it('returns mapped snapshots', async () => {
      assetSnapshotService.findByAsset.mockResolvedValue([sampleSnapshot]);
      const result = await controller.getSnapshots('a1');
      expect(assetSnapshotService.findByAsset).toHaveBeenCalledWith('a1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });
  });

  describe('createSnapshot', () => {
    it('calls assetSnapshotService.create and returns mapped response', async () => {
      assetSnapshotService.create.mockResolvedValue(sampleSnapshot);
      const dto = { value: '1000', observedAt: '2024-01-01T00:00:00.000Z' };
      const result = await controller.createSnapshot('a1', dto as any);
      expect(assetSnapshotService.create).toHaveBeenCalledWith({
        assetId: 'a1',
        value: '1000',
        observedAt: new Date('2024-01-01T00:00:00.000Z'),
      });
      expect(result.id).toBe('s1');
    });

    it('throws BadRequestException for invalid observedAt date', async () => {
      const dto = { value: '1000', observedAt: 'not-a-date' };
      await expect(controller.createSnapshot('a1', dto as any)).rejects.toThrow(
        'Invalid date: observedAt',
      );
      expect(assetSnapshotService.create).not.toHaveBeenCalled();
    });
  });

  describe('updateSnapshot', () => {
    it('updates snapshot with value and date', async () => {
      assetSnapshotService.update.mockResolvedValue(sampleSnapshot);
      const dto = { value: '2000', observedAt: '2024-06-01T00:00:00.000Z' };
      const result = await controller.updateSnapshot('a1', 's1', dto as any);
      expect(assetSnapshotService.update).toHaveBeenCalledWith('s1', {
        value: '2000',
        observedAt: new Date('2024-06-01T00:00:00.000Z'),
      });
      expect(result.id).toBe('s1');
    });

    it('updates snapshot with value only', async () => {
      assetSnapshotService.update.mockResolvedValue(sampleSnapshot);
      const dto = { value: '2000' };
      await controller.updateSnapshot('a1', 's1', dto as any);
      expect(assetSnapshotService.update).toHaveBeenCalledWith('s1', { value: '2000' });
    });

    it('throws BadRequestException for invalid observedAt in update', async () => {
      const dto = { observedAt: 'not-a-date' };
      await expect(controller.updateSnapshot('a1', 's1', dto as any)).rejects.toThrow(
        'Invalid date: observedAt',
      );
      expect(assetSnapshotService.update).not.toHaveBeenCalled();
    });
  });

  describe('addTagToAsset', () => {
    it('calls assetService.addTag and returns mapped response', async () => {
      assetService.addTag.mockResolvedValue(sampleAsset);
      const result = await controller.addTagToAsset('a1', 't1');
      expect(assetService.addTag).toHaveBeenCalledWith('a1', 't1');
      expect(result.id).toBe('a1');
    });
  });

  describe('removeTagFromAsset', () => {
    it('calls assetService.removeTag', async () => {
      assetService.removeTag.mockResolvedValue(undefined);
      await controller.removeTagFromAsset('a1', 't1');
      expect(assetService.removeTag).toHaveBeenCalledWith('a1', 't1');
    });
  });

  describe('addCategoryToAsset', () => {
    it('calls assetService.addCategory and returns mapped response', async () => {
      assetService.addCategory.mockResolvedValue(sampleAsset);
      const result = await controller.addCategoryToAsset('a1', 'c1');
      expect(assetService.addCategory).toHaveBeenCalledWith('a1', 'c1');
      expect(result.id).toBe('a1');
    });
  });

  describe('removeCategoryFromAsset', () => {
    it('calls assetService.removeCategory', async () => {
      assetService.removeCategory.mockResolvedValue(undefined);
      await controller.removeCategoryFromAsset('a1', 'c1');
      expect(assetService.removeCategory).toHaveBeenCalledWith('a1', 'c1');
    });
  });

  describe('response mapping', () => {
    it('maps asset with null quantity to null', async () => {
      const assetNullQty = new Asset(
        'a2',
        'No Qty',
        null,
        false,
        'at1',
        now,
        now,
      );
      assetService.findById.mockResolvedValue(assetNullQty);
      const result = await controller.findById('a2');
      expect(result.quantity).toBeNull();
    });

    it('maps asset with null assetType to null', async () => {
      const assetNoRelations = new Asset(
        'a3',
        'No Relations',
        new Decimal('1'),
        false,
        'at1',
        now,
        now,
        null,
      );
      assetService.findById.mockResolvedValue(assetNoRelations);
      const result = await controller.findById('a3');
      expect(result.assetType).toBeNull();
    });

    it('maps asset with categories and tags', async () => {
      const cat = new Category('c1', 'Financial', null);
      const tag = new Tag('t1', 'crypto');
      const assetWithRelations = new Asset(
        'a4',
        'Rich Asset',
        new Decimal('5'),
        false,
        'at1',
        now,
        now,
        sampleAssetType,
        [],
        [],
        [cat],
        [tag],
      );
      assetService.findById.mockResolvedValue(assetWithRelations);
      const result = await controller.findById('a4');
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe('Financial');
      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].name).toBe('crypto');
    });
  });
});
