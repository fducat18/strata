import { Test, TestingModule } from '@nestjs/testing';
import { AssetTypeService } from './asset-type.service.js';
import { IAssetTypeRepository } from '../../domain/ports/index.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';
import { AssetTypeNotFoundException } from '../../domain/exceptions/index.js';

describe('AssetTypeService', () => {
  let service: AssetTypeService;

  const mockAssetTypeRepo = {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByCode: jest.fn(),
  };

  const sampleAssetType = new AssetType('at1', 'STOCKS', 'Stocks');
  const sampleAssetType2 = new AssetType('at2', 'CRYPTO', 'Crypto');

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetTypeService,
        { provide: IAssetTypeRepository, useValue: mockAssetTypeRepo },
      ],
    }).compile();

    service = module.get<AssetTypeService>(AssetTypeService);
  });

  describe('findById', () => {
    it('throws AssetTypeNotFoundException when not found', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(
        AssetTypeNotFoundException,
      );
    });

    it('returns asset type when found', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      const result = await service.findById('at1');
      expect(result).toBe(sampleAssetType);
    });
  });

  describe('findAll', () => {
    it('returns all asset types', async () => {
      mockAssetTypeRepo.findAll.mockResolvedValue([
        sampleAssetType,
        sampleAssetType2,
      ]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('STOCKS');
    });
  });
});
