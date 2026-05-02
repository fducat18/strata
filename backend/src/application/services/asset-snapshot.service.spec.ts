import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { AssetSnapshotService } from './asset-snapshot.service.js';
import {
  IAssetSnapshotRepository,
  IAssetRepository,
} from '../../domain/ports/index.js';
import { AssetSnapshot } from '../../domain/entities/asset-snapshot.entity.js';
import { Asset } from '../../domain/entities/asset.entity.js';
import { AssetNotFoundException } from '../../domain/exceptions/index.js';
import { PortfolioSnapshotService } from './portfolio-snapshot.service.js';

describe('AssetSnapshotService', () => {
  let service: AssetSnapshotService;

  const mockAssetSnapshotRepo = {
    save: jest.fn(),
    findByAsset: jest.fn(),
  };

  const mockAssetRepo = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    dispose: jest.fn(),
    addCategory: jest.fn(),
    removeCategory: jest.fn(),
    addTag: jest.fn(),
    removeTag: jest.fn(),
  };

  const mockPortfolioSnapshotService = {
    recalculateFromDate: jest.fn(),
  };

  const now = new Date('2024-01-01T00:00:00.000Z');
  const sampleAsset = new Asset(
    'a1',
    'My Asset',
    new Decimal('10'),
    false,
    'at1',
    now,
    now,
  );
  const sampleSnapshot = new AssetSnapshot(
    's1',
    'a1',
    new Decimal('1000'),
    now,
    now,
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetSnapshotService,
        { provide: IAssetSnapshotRepository, useValue: mockAssetSnapshotRepo },
        { provide: IAssetRepository, useValue: mockAssetRepo },
        { provide: PortfolioSnapshotService, useValue: mockPortfolioSnapshotService },
      ],
    }).compile();

    service = module.get<AssetSnapshotService>(AssetSnapshotService);
  });

  describe('create', () => {
    it('throws AssetNotFoundException when asset does not exist', async () => {
      mockAssetRepo.findById.mockResolvedValue(null);
      await expect(
        service.create({
          assetId: 'unknown',
          value: '1000',
          observedAt: now,
        }),
      ).rejects.toThrow(AssetNotFoundException);
    });

    it('saves snapshot when asset exists', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetSnapshotRepo.save.mockResolvedValue(sampleSnapshot);
      mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);
      const data = { assetId: 'a1', value: '1000', observedAt: now };
      const result = await service.create(data);
      expect(mockAssetSnapshotRepo.save).toHaveBeenCalledWith(data);
      expect(result).toBe(sampleSnapshot);
    });

    it('triggers portfolio recalculation after save', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetSnapshotRepo.save.mockResolvedValue(sampleSnapshot);
      mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);
      await service.create({ assetId: 'a1', value: '1000', observedAt: now });
      expect(mockPortfolioSnapshotService.recalculateFromDate).toHaveBeenCalledWith(sampleSnapshot.observedAt);
    });
  });

  describe('findByAsset', () => {
    it('throws AssetNotFoundException when asset does not exist', async () => {
      mockAssetRepo.findById.mockResolvedValue(null);
      await expect(service.findByAsset('unknown')).rejects.toThrow(
        AssetNotFoundException,
      );
    });

    it('returns snapshots when asset exists', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetSnapshotRepo.findByAsset.mockResolvedValue([sampleSnapshot]);
      const result = await service.findByAsset('a1');
      expect(mockAssetSnapshotRepo.findByAsset).toHaveBeenCalledWith('a1');
      expect(result).toEqual([sampleSnapshot]);
    });
  });
});
