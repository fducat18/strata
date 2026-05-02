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

    repository = module.get<PrismaAssetTypeRepository>(
      PrismaAssetTypeRepository,
    );
  });

  describe('findById', () => {
    it('returns mapped asset type when found', async () => {
      mockPrismaService.assetType.findUnique.mockResolvedValue(assetTypeRow);
      const result = await repository.findById('at1');
      expect(mockPrismaService.assetType.findUnique).toHaveBeenCalledWith({
        where: { id: 'at1' },
      });
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
      mockPrismaService.assetType.findMany.mockResolvedValue([
        assetTypeRow,
        assetTypeRow2,
      ]);
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
});
