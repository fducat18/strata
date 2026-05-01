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
});
