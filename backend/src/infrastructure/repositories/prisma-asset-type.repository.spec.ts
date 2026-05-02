import { Test, TestingModule } from '@nestjs/testing';
import { PrismaAssetTypeRepository } from './prisma-asset-type.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PrismaAssetTypeRepository', () => {
  let repository: PrismaAssetTypeRepository;

  const assetTypeRow = { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' };
  const assetTypeRow2 = { id: 'at2', code: 'CRYPTO', label: 'Crypto', group: 'FINANCIAL' };

  const mockPrismaService = {
    assetType: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    asset: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaAssetTypeRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<PrismaAssetTypeRepository>(PrismaAssetTypeRepository);
  });

  describe('findById', () => {
    it('returns mapped asset type when found', async () => {
      mockPrismaService.assetType.findUnique.mockResolvedValue(assetTypeRow);
      const result = await repository.findById('at1');
      expect(mockPrismaService.assetType.findUnique).toHaveBeenCalledWith({ where: { id: 'at1' } });
      expect(result?.id).toBe('at1');
      expect(result?.code).toBe('STOCKS');
      expect(result?.label).toBe('Stocks');
      expect(result?.group).toBe('FINANCIAL');
    });

    it('returns null when not found', async () => {
      mockPrismaService.assetType.findUnique.mockResolvedValue(null);
      const result = await repository.findById('unknown');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all asset types mapped', async () => {
      mockPrismaService.assetType.findMany.mockResolvedValue([assetTypeRow, assetTypeRow2]);
      const result = await repository.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('STOCKS');
      expect(result[1].code).toBe('CRYPTO');
    });

    it('returns empty array when none found', async () => {
      mockPrismaService.assetType.findMany.mockResolvedValue([]);
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates and returns mapped asset type', async () => {
      const newRow = { id: 'at3', code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' };
      mockPrismaService.assetType.create.mockResolvedValue(newRow);
      const result = await repository.create({ code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' });
      expect(mockPrismaService.assetType.create).toHaveBeenCalledWith({
        data: { code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' },
      });
      expect(result.id).toBe('at3');
      expect(result.code).toBe('CRYPTO_ETF');
    });
  });

  describe('update', () => {
    it('updates label and group and returns mapped asset type', async () => {
      const updatedRow = { id: 'at1', code: 'STOCKS', label: 'Public Stocks', group: 'FINANCIAL' };
      mockPrismaService.assetType.update.mockResolvedValue(updatedRow);
      const result = await repository.update('at1', { label: 'Public Stocks', group: 'FINANCIAL' });
      expect(mockPrismaService.assetType.update).toHaveBeenCalledWith({
        where: { id: 'at1' },
        data: { label: 'Public Stocks', group: 'FINANCIAL' },
      });
      expect(result.label).toBe('Public Stocks');
    });
  });

  describe('delete', () => {
    it('deletes by id', async () => {
      mockPrismaService.assetType.delete.mockResolvedValue(assetTypeRow);
      await repository.delete('at1');
      expect(mockPrismaService.assetType.delete).toHaveBeenCalledWith({ where: { id: 'at1' } });
    });
  });

  describe('countByTypeId', () => {
    it('returns count of assets using this type', async () => {
      mockPrismaService.asset.count.mockResolvedValue(3);
      const count = await repository.countByTypeId('at1');
      expect(mockPrismaService.asset.count).toHaveBeenCalledWith({ where: { assetTypeId: 'at1' } });
      expect(count).toBe(3);
    });

    it('returns 0 when no assets use this type', async () => {
      mockPrismaService.asset.count.mockResolvedValue(0);
      const count = await repository.countByTypeId('at1');
      expect(count).toBe(0);
    });
  });
});
