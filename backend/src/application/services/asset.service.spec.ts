import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { AssetService } from './asset.service.js';
import { IAssetRepository } from '../../domain/ports/asset.repository.port.js';
import { IPortfolioRepository } from '../../domain/ports/portfolio.repository.port.js';
import { IAssetTypeRepository } from '../../domain/ports/asset-type.repository.port.js';
import { Asset } from '../../domain/entities/asset.entity.js';
import { Portfolio } from '../../domain/entities/portfolio.entity.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';
import {
  AssetNotFoundException,
  PortfolioNotFoundException,
  AssetTypeNotFoundException,
} from '../../domain/exceptions/domain.exceptions.js';

describe('AssetService', () => {
  let service: AssetService;

  const mockAssetRepo = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findByPortfolio: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    dispose: jest.fn(),
    addCategory: jest.fn(),
    removeCategory: jest.fn(),
    addTag: jest.fn(),
    removeTag: jest.fn(),
  };

  const mockPortfolioRepo = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockAssetTypeRepo = {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByCode: jest.fn(),
  };

  const now = new Date();
  const samplePortfolio = new Portfolio('p1', 'Portfolio', 'EUR', now, now);
  const sampleAssetType = new AssetType('at1', 'STOCKS', 'Stocks');
  const sampleAsset = new Asset(
    'a1', 'My Asset', new Decimal('10'), false,
    'p1', 'at1', now, now,
    sampleAssetType, samplePortfolio,
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        { provide: IAssetRepository, useValue: mockAssetRepo },
        { provide: IPortfolioRepository, useValue: mockPortfolioRepo },
        { provide: IAssetTypeRepository, useValue: mockAssetTypeRepo },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
  });

  describe('create', () => {
    it('throws PortfolioNotFoundException when portfolio does not exist', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(null);
      await expect(
        service.create({ name: 'A', portfolioId: 'p-unknown', assetTypeId: 'at1' }),
      ).rejects.toThrow(PortfolioNotFoundException);
    });

    it('throws AssetTypeNotFoundException when asset type does not exist', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(samplePortfolio);
      mockAssetTypeRepo.findById.mockResolvedValue(null);
      await expect(
        service.create({ name: 'A', portfolioId: 'p1', assetTypeId: 'at-unknown' }),
      ).rejects.toThrow(AssetTypeNotFoundException);
    });

    it('calls repository.save when valid', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(samplePortfolio);
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      mockAssetRepo.save.mockResolvedValue(sampleAsset);

      const data = { name: 'My Asset', portfolioId: 'p1', assetTypeId: 'at1' };
      const result = await service.create(data);

      expect(mockAssetRepo.save).toHaveBeenCalledWith(data);
      expect(result).toBe(sampleAsset);
    });
  });

  describe('findById', () => {
    it('throws AssetNotFoundException when not found', async () => {
      mockAssetRepo.findById.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(AssetNotFoundException);
    });

    it('returns asset when found', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      const result = await service.findById('a1');
      expect(result).toBe(sampleAsset);
    });
  });

  describe('findAll', () => {
    it('returns all assets', async () => {
      mockAssetRepo.findAll.mockResolvedValue([sampleAsset]);
      const result = await service.findAll();
      expect(result).toEqual([sampleAsset]);
    });
  });

  describe('findByPortfolio', () => {
    it('throws PortfolioNotFoundException when portfolio does not exist', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(null);
      await expect(service.findByPortfolio('p-unknown')).rejects.toThrow(PortfolioNotFoundException);
    });

    it('returns assets for valid portfolio', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(samplePortfolio);
      mockAssetRepo.findByPortfolio.mockResolvedValue([sampleAsset]);
      const result = await service.findByPortfolio('p1');
      expect(result).toEqual([sampleAsset]);
    });
  });

  describe('update', () => {
    it('throws AssetNotFoundException when not found', async () => {
      mockAssetRepo.findById.mockResolvedValue(null);
      await expect(service.update('unknown', { name: 'Updated' })).rejects.toThrow(AssetNotFoundException);
    });

    it('throws AssetTypeNotFoundException when new asset type does not exist', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetTypeRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('a1', { assetTypeId: 'at-unknown' }),
      ).rejects.toThrow(AssetTypeNotFoundException);
    });

    it('calls repository.update when valid', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetRepo.update.mockResolvedValue(sampleAsset);
      await service.update('a1', { name: 'Updated' });
      expect(mockAssetRepo.update).toHaveBeenCalledWith('a1', { name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('throws AssetNotFoundException when not found', async () => {
      mockAssetRepo.findById.mockResolvedValue(null);
      await expect(service.delete('unknown')).rejects.toThrow(AssetNotFoundException);
    });

    it('calls repository.delete when found', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetRepo.delete.mockResolvedValue(undefined);
      await service.delete('a1');
      expect(mockAssetRepo.delete).toHaveBeenCalledWith('a1');
    });
  });

  describe('dispose', () => {
    it('throws AssetNotFoundException when not found', async () => {
      mockAssetRepo.findById.mockResolvedValue(null);
      await expect(service.dispose('unknown')).rejects.toThrow(AssetNotFoundException);
    });

    it('calls repository.dispose when found', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      const disposedAsset = sampleAsset.dispose();
      mockAssetRepo.dispose.mockResolvedValue(disposedAsset);
      const result = await service.dispose('a1');
      expect(mockAssetRepo.dispose).toHaveBeenCalledWith('a1');
      expect(result.isDisposed()).toBe(true);
    });
  });

  describe('addCategory', () => {
    it('calls repository.addCategory', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetRepo.addCategory.mockResolvedValue(sampleAsset);
      await service.addCategory('a1', 'c1');
      expect(mockAssetRepo.addCategory).toHaveBeenCalledWith('a1', 'c1');
    });
  });

  describe('removeCategory', () => {
    it('calls repository.removeCategory', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetRepo.removeCategory.mockResolvedValue(sampleAsset);
      await service.removeCategory('a1', 'c1');
      expect(mockAssetRepo.removeCategory).toHaveBeenCalledWith('a1', 'c1');
    });
  });

  describe('addTag', () => {
    it('calls repository.addTag', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetRepo.addTag.mockResolvedValue(sampleAsset);
      await service.addTag('a1', 't1');
      expect(mockAssetRepo.addTag).toHaveBeenCalledWith('a1', 't1');
    });
  });

  describe('removeTag', () => {
    it('calls repository.removeTag', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetRepo.removeTag.mockResolvedValue(sampleAsset);
      await service.removeTag('a1', 't1');
      expect(mockAssetRepo.removeTag).toHaveBeenCalledWith('a1', 't1');
    });
  });
});
