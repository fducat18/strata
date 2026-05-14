import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { PrismaAssetSnapshotRepository } from './prisma-asset-snapshot.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PrismaAssetSnapshotRepository', () => {
  let repository: PrismaAssetSnapshotRepository;

  const now = new Date('2024-01-01T00:00:00.000Z');
  const snapshotRow = {
    id: 's1',
    assetId: 'a1',
    value: new Decimal('1000'),
    observedAt: now,
    createdAt: now,
  };

  const mockPrismaService = {
    assetSnapshot: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaAssetSnapshotRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<PrismaAssetSnapshotRepository>(
      PrismaAssetSnapshotRepository,
    );
  });

  describe('save', () => {
    it('creates snapshot and maps to entity', async () => {
      mockPrismaService.assetSnapshot.create.mockResolvedValue(snapshotRow);
      const data = { assetId: 'a1', value: '1000', observedAt: now };
      const result = await repository.save(data);
      expect(mockPrismaService.assetSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assetId: 'a1',
            value: expect.any(Decimal),
            observedAt: now,
          }),
        }),
      );
      expect(result.id).toBe('s1');
      expect(result.assetId).toBe('a1');
      expect(result.value).toBeInstanceOf(Decimal);
      expect(result.value.toString()).toBe('1000');
    });
  });

  describe('findByAsset', () => {
    it('returns snapshots ordered by observedAt desc', async () => {
      mockPrismaService.assetSnapshot.findMany.mockResolvedValue([snapshotRow]);
      const result = await repository.findByAsset('a1');
      expect(mockPrismaService.assetSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assetId: 'a1' },
          orderBy: { observedAt: 'desc' },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });

    it('returns empty array when no snapshots', async () => {
      mockPrismaService.assetSnapshot.findMany.mockResolvedValue([]);
      const result = await repository.findByAsset('unknown');
      expect(result).toEqual([]);
    });
  });

  describe('findLatestByAsset', () => {
    it('returns latest snapshot when found', async () => {
      mockPrismaService.assetSnapshot.findFirst.mockResolvedValue(snapshotRow);
      const result = await repository.findLatestByAsset('a1');
      expect(mockPrismaService.assetSnapshot.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assetId: 'a1' },
          orderBy: { observedAt: 'desc' },
        }),
      );
      expect(result?.id).toBe('s1');
    });

    it('returns null when no snapshots', async () => {
      mockPrismaService.assetSnapshot.findFirst.mockResolvedValue(null);
      const result = await repository.findLatestByAsset('unknown');
      expect(result).toBeNull();
    });
  });

  describe('findLatestPerNonDisposedAsset', () => {
    it('returns mapped array', async () => {
      mockPrismaService.assetSnapshot.findMany.mockResolvedValue([snapshotRow]);
      const result = await repository.findLatestPerNonDisposedAsset();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });
  });

  describe('findLatestPerNonDisposedAssetAsOf', () => {
    it('returns snapshots up to given date', async () => {
      mockPrismaService.assetSnapshot.findMany.mockResolvedValue([snapshotRow]);
      const cutoff = new Date('2025-01-01T00:00:00.000Z');
      const result = await repository.findLatestPerNonDisposedAssetAsOf(cutoff);
      expect(mockPrismaService.assetSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ observedAt: { lte: cutoff } }) }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findEarliestByAsset', () => {
    it('returns earliest snapshot', async () => {
      mockPrismaService.assetSnapshot.findFirst.mockResolvedValue(snapshotRow);
      const result = await repository.findEarliestByAsset('a1');
      expect(result).not.toBeNull();
    });

    it('returns null when not found', async () => {
      mockPrismaService.assetSnapshot.findFirst.mockResolvedValue(null);
      const result = await repository.findEarliestByAsset('a1');
      expect(result).toBeNull();
    });
  });

  describe('updateObservedAt', () => {
    it('updates and maps entity', async () => {
      const newDate = new Date('2025-06-01T00:00:00.000Z');
      mockPrismaService.assetSnapshot.update.mockResolvedValue({ ...snapshotRow, observedAt: newDate });
      const result = await repository.updateObservedAt('s1', newDate);
      expect(mockPrismaService.assetSnapshot.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { observedAt: newDate },
      });
      expect(result.observedAt).toEqual(newDate);
    });
  });

  describe('findLatestPerNonDisposedAssetWithGroup', () => {
    it('maps group from assetType', async () => {
      const rowWithGroup = { ...snapshotRow, asset: { assetType: { group: 'FINANCIAL' } } };
      mockPrismaService.assetSnapshot.findMany.mockResolvedValue([rowWithGroup]);
      const result = await repository.findLatestPerNonDisposedAssetWithGroup();
      expect(result[0].group).toBe('FINANCIAL');
      expect(result[0].value.toString()).toBe('1000');
    });

    it('falls back to OTHER when assetType is null', async () => {
      const rowNoType = { ...snapshotRow, asset: { assetType: null } };
      mockPrismaService.assetSnapshot.findMany.mockResolvedValue([rowNoType]);
      const result = await repository.findLatestPerNonDisposedAssetWithGroup();
      expect(result[0].group).toBe('OTHER');
    });
  });

  describe('findLatestPerNonDisposedAssetAsOfWithGroup', () => {
    it('returns snapshots with group up to date', async () => {
      const rowWithGroup = { ...snapshotRow, asset: { assetType: { group: 'REAL_ESTATE' } } };
      mockPrismaService.assetSnapshot.findMany.mockResolvedValue([rowWithGroup]);
      const result = await repository.findLatestPerNonDisposedAssetAsOfWithGroup(new Date());
      expect(result[0].group).toBe('REAL_ESTATE');
    });
  });

  describe('findByAssetAndDate', () => {
    it('returns snapshot within date range', async () => {
      mockPrismaService.assetSnapshot.findFirst.mockResolvedValue(snapshotRow);
      const result = await repository.findByAssetAndDate('a1', new Date('2024-01-01T00:00:00.000Z'));
      expect(result).not.toBeNull();
      expect(result!.id).toBe('s1');
    });

    it('returns null when none found', async () => {
      mockPrismaService.assetSnapshot.findFirst.mockResolvedValue(null);
      const result = await repository.findByAssetAndDate('a1', new Date());
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns snapshot when found', async () => {
      mockPrismaService.assetSnapshot.findUnique.mockResolvedValue(snapshotRow);
      const result = await repository.findById('s1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('s1');
    });

    it('returns null when not found', async () => {
      mockPrismaService.assetSnapshot.findUnique.mockResolvedValue(null);
      const result = await repository.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates value and observedAt', async () => {
      const newDate = new Date('2025-06-01T00:00:00.000Z');
      const updated = { ...snapshotRow, value: new Decimal('2000'), observedAt: newDate };
      mockPrismaService.assetSnapshot.update.mockResolvedValue(updated);
      const result = await repository.update('s1', { value: '2000', observedAt: newDate });
      expect(mockPrismaService.assetSnapshot.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 's1' } }),
      );
      expect(result.value.toString()).toBe('2000');
    });

    it('updates only value when observedAt omitted', async () => {
      mockPrismaService.assetSnapshot.update.mockResolvedValue(snapshotRow);
      await repository.update('s1', { value: '999' });
      const callArg = mockPrismaService.assetSnapshot.update.mock.calls[0][0];
      expect(callArg.data).toEqual({ value: expect.any(Decimal) });
      expect(callArg.data.observedAt).toBeUndefined();
    });

    it('updates only observedAt when value omitted', async () => {
      const newDate = new Date();
      mockPrismaService.assetSnapshot.update.mockResolvedValue(snapshotRow);
      await repository.update('s1', { observedAt: newDate });
      const callArg = mockPrismaService.assetSnapshot.update.mock.calls[0][0];
      expect(callArg.data).toEqual({ observedAt: newDate });
    });
  });

  describe('delete', () => {
    it('calls prisma.assetSnapshot.delete with the given id', async () => {
      mockPrismaService.assetSnapshot.delete.mockResolvedValue(snapshotRow);
      await repository.delete('s1');
      expect(mockPrismaService.assetSnapshot.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    });
  });
});
