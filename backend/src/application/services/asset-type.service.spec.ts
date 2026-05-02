import { Test, TestingModule } from '@nestjs/testing';
import { AssetTypeService } from './asset-type.service.js';
import { IAssetTypeRepository } from '../../domain/ports/index.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';
import {
  AssetTypeNotFoundException,
  AssetTypeInUseException,
} from '../../domain/exceptions/index.js';

describe('AssetTypeService', () => {
  let service: AssetTypeService;

  const mockAssetTypeRepo = {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByTypeId: jest.fn(),
  };

  const sampleAssetType = new AssetType('at1', 'STOCKS', 'Stocks', 'FINANCIAL');
  const sampleAssetType2 = new AssetType('at2', 'CRYPTO', 'Crypto', 'FINANCIAL');

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
      await expect(service.findById('unknown')).rejects.toThrow(AssetTypeNotFoundException);
    });

    it('returns asset type when found', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      const result = await service.findById('at1');
      expect(result).toBe(sampleAssetType);
    });
  });

  describe('findAll', () => {
    it('returns all asset types', async () => {
      mockAssetTypeRepo.findAll.mockResolvedValue([sampleAssetType, sampleAssetType2]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('STOCKS');
    });
  });

  describe('create', () => {
    it('creates and returns new asset type', async () => {
      const newType = new AssetType('at3', 'CRYPTO_ETF', 'Crypto ETF', 'FINANCIAL');
      mockAssetTypeRepo.create.mockResolvedValue(newType);
      const result = await service.create({ code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' });
      expect(mockAssetTypeRepo.create).toHaveBeenCalledWith({
        code: 'CRYPTO_ETF',
        label: 'Crypto ETF',
        group: 'FINANCIAL',
      });
      expect(result.code).toBe('CRYPTO_ETF');
    });
  });

  describe('update', () => {
    it('throws AssetTypeNotFoundException when asset type not found', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('unknown', { label: 'New Label', group: 'FINANCIAL' })
      ).rejects.toThrow(AssetTypeNotFoundException);
    });

    it('updates and returns asset type', async () => {
      const updated = new AssetType('at1', 'STOCKS', 'Public Stocks', 'FINANCIAL');
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      mockAssetTypeRepo.update.mockResolvedValue(updated);
      const result = await service.update('at1', { label: 'Public Stocks', group: 'FINANCIAL' });
      expect(mockAssetTypeRepo.update).toHaveBeenCalledWith('at1', {
        label: 'Public Stocks',
        group: 'FINANCIAL',
      });
      expect(result.label).toBe('Public Stocks');
    });
  });

  describe('delete', () => {
    it('throws AssetTypeNotFoundException when not found', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(null);
      await expect(service.delete('unknown')).rejects.toThrow(AssetTypeNotFoundException);
    });

    it('throws AssetTypeInUseException when assets reference this type', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      mockAssetTypeRepo.countByTypeId.mockResolvedValue(2);
      await expect(service.delete('at1')).rejects.toThrow(AssetTypeInUseException);
    });

    it('throws AssetTypeInUseException when exactly 1 asset references this type', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      mockAssetTypeRepo.countByTypeId.mockResolvedValue(1);
      await expect(service.delete('at1')).rejects.toThrow(AssetTypeInUseException);
    });

    it('deletes when no assets reference this type', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      mockAssetTypeRepo.countByTypeId.mockResolvedValue(0);
      mockAssetTypeRepo.delete.mockResolvedValue(undefined);
      await service.delete('at1');
      expect(mockAssetTypeRepo.delete).toHaveBeenCalledWith('at1');
    });
  });
});
