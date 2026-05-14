import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { AssetSnapshotService } from './asset-snapshot.service.js';
import {
  IAssetSnapshotRepository,
  IAssetRepository,
} from '../../domain/ports/index.js';
import { AssetSnapshot } from '../../domain/entities/asset-snapshot.entity.js';
import { Asset } from '../../domain/entities/asset.entity.js';
import {
  AssetNotFoundException,
  AssetSnapshotNotFoundException,
} from '../../domain/exceptions/index.js';
import { PortfolioSnapshotService } from './portfolio-snapshot.service.js';

describe('AssetSnapshotService', () => {
  let service: AssetSnapshotService;

  const mockAssetSnapshotRepo = {
    save: jest.fn(),
    findByAsset: jest.fn(),
    findByAssetAndDate: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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

    it('saves snapshot when asset exists and no duplicate', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetSnapshotRepo.findByAssetAndDate.mockResolvedValue(null);
      mockAssetSnapshotRepo.save.mockResolvedValue(sampleSnapshot);
      mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);
      const data = { assetId: 'a1', value: '1000', observedAt: now };
      const result = await service.create(data);
      expect(mockAssetSnapshotRepo.save).toHaveBeenCalledWith(data);
      expect(result).toBe(sampleSnapshot);
    });

    it('throws ConflictException when snapshot already exists for same day', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetSnapshotRepo.findByAssetAndDate.mockResolvedValue(sampleSnapshot);
      await expect(
        service.create({ assetId: 'a1', value: '1000', observedAt: now }),
      ).rejects.toThrow(ConflictException);
    });

    it('triggers portfolio recalculation after save', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetSnapshotRepo.findByAssetAndDate.mockResolvedValue(null);
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

  describe('update', () => {
    it('throws AssetSnapshotNotFoundException when snapshot does not exist', async () => {
      mockAssetSnapshotRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('unknown', { value: '2000' }),
      ).rejects.toThrow(AssetSnapshotNotFoundException);
    });

    it('updates snapshot and triggers portfolio recalculation', async () => {
      const updatedSnapshot = new AssetSnapshot('s1', 'a1', new Decimal('2000'), now, now);
      mockAssetSnapshotRepo.findById.mockResolvedValue(sampleSnapshot);
      mockAssetSnapshotRepo.update.mockResolvedValue(updatedSnapshot);
      mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);
      const result = await service.update('s1', { value: '2000' });
      expect(mockAssetSnapshotRepo.update).toHaveBeenCalledWith('s1', { value: '2000' });
      expect(mockPortfolioSnapshotService.recalculateFromDate).toHaveBeenCalledWith(now);
      expect(result).toBe(updatedSnapshot);
    });

    it('uses earlier of old and new date for recalculation when date changes', async () => {
      const olderDate = new Date('2023-06-01T00:00:00.000Z');
      const updatedSnapshot = new AssetSnapshot('s1', 'a1', new Decimal('2000'), olderDate, now);
      mockAssetSnapshotRepo.findById.mockResolvedValue(sampleSnapshot);
      mockAssetSnapshotRepo.update.mockResolvedValue(updatedSnapshot);
      mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);
      await service.update('s1', { value: '2000', observedAt: olderDate });
      expect(mockPortfolioSnapshotService.recalculateFromDate).toHaveBeenCalledWith(olderDate);
    });
  });

  describe('delete', () => {
    it('throws AssetSnapshotNotFoundException when snapshot does not exist', async () => {
      mockAssetSnapshotRepo.findById.mockResolvedValue(null);
      await expect(service.delete('unknown')).rejects.toThrow(AssetSnapshotNotFoundException);
    });

    it('deletes snapshot and triggers portfolio recalculation from its date', async () => {
      mockAssetSnapshotRepo.findById.mockResolvedValue(sampleSnapshot);
      mockAssetSnapshotRepo.delete.mockResolvedValue(undefined);
      mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);
      await service.delete('s1');
      expect(mockAssetSnapshotRepo.delete).toHaveBeenCalledWith('s1');
      expect(mockPortfolioSnapshotService.recalculateFromDate).toHaveBeenCalledWith(sampleSnapshot.observedAt);
    });
  });
});
