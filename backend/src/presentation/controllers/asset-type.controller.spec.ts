import { Test, TestingModule } from '@nestjs/testing';
import { AssetTypeController } from './asset-type.controller.js';
import { AssetTypeService } from '../../application/services/index.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';

describe('AssetTypeController', () => {
  let controller: AssetTypeController;
  let assetTypeService: jest.Mocked<AssetTypeService>;

  const sampleAssetType = new AssetType('at1', 'STOCKS', 'Stocks', 'FINANCIAL');
  const sampleAssetType2 = new AssetType('at2', 'CRYPTO', 'Crypto', 'FINANCIAL');

  beforeEach(async () => {
    const mockAssetTypeService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetTypeController],
      providers: [
        { provide: AssetTypeService, useValue: mockAssetTypeService },
      ],
    }).compile();

    controller = module.get<AssetTypeController>(AssetTypeController);
    assetTypeService = module.get(AssetTypeService);
  });

  describe('findAll', () => {
    it('returns all asset types mapped to response DTOs', async () => {
      assetTypeService.findAll.mockResolvedValue([sampleAssetType, sampleAssetType2]);
      const result = await controller.findAll();
      expect(assetTypeService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('at1');
      expect(result[0].code).toBe('STOCKS');
      expect(result[0].label).toBe('Stocks');
      expect(result[0].group).toBe('FINANCIAL');
      expect(result[1].id).toBe('at2');
    });
  });

  describe('findById', () => {
    it('returns mapped asset type', async () => {
      assetTypeService.findById.mockResolvedValue(sampleAssetType);
      const result = await controller.findById('at1');
      expect(assetTypeService.findById).toHaveBeenCalledWith('at1');
      expect(result.id).toBe('at1');
      expect(result.code).toBe('STOCKS');
    });
  });

  describe('create', () => {
    it('creates and returns mapped asset type', async () => {
      const newType = new AssetType('at3', 'CRYPTO_ETF', 'Crypto ETF', 'FINANCIAL');
      assetTypeService.create.mockResolvedValue(newType);
      const result = await controller.create({
        code: 'CRYPTO_ETF',
        label: 'Crypto ETF',
        group: 'FINANCIAL' as any,
      });
      expect(assetTypeService.create).toHaveBeenCalledWith({
        code: 'CRYPTO_ETF',
        label: 'Crypto ETF',
        group: 'FINANCIAL',
      });
      expect(result.id).toBe('at3');
      expect(result.code).toBe('CRYPTO_ETF');
      expect(result.group).toBe('FINANCIAL');
    });
  });

  describe('update', () => {
    it('updates and returns mapped asset type', async () => {
      const updated = new AssetType('at1', 'STOCKS', 'Public Stocks', 'FINANCIAL');
      assetTypeService.update.mockResolvedValue(updated);
      const result = await controller.update('at1', {
        label: 'Public Stocks',
        group: 'FINANCIAL' as any,
      });
      expect(assetTypeService.update).toHaveBeenCalledWith('at1', {
        label: 'Public Stocks',
        group: 'FINANCIAL',
      });
      expect(result.label).toBe('Public Stocks');
    });
  });

  describe('delete', () => {
    it('calls delete service method', async () => {
      assetTypeService.delete.mockResolvedValue(undefined);
      await controller.delete('at1');
      expect(assetTypeService.delete).toHaveBeenCalledWith('at1');
    });
  });
});
