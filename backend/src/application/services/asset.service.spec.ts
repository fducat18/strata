import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { AssetService } from './asset.service.js';
import { IAssetRepository } from '../../domain/ports/asset.repository.port.js';
import { IAssetTypeRepository } from '../../domain/ports/asset-type.repository.port.js';
import { ITagRepository } from '../../domain/ports/tag.repository.port.js';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';
import { ITransactionRepository } from '../../domain/ports/transaction.repository.port.js';
import { IAssetSnapshotRepository } from '../../domain/ports/asset-snapshot.repository.port.js';
import { AssetSnapshotService } from './asset-snapshot.service.js';
import { PortfolioSnapshotService } from './portfolio-snapshot.service.js';
import { Asset } from '../../domain/entities/asset.entity.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';
import { Tag } from '../../domain/entities/tag.entity.js';
import { Category } from '../../domain/entities/category.entity.js';
import {
  AssetNotFoundException,
  AssetTypeNotFoundException,
  TagNotFoundException,
  CategoryNotFoundException,
  AssetAlreadyDisposedException,
} from '../../domain/exceptions/domain.exceptions.js';

describe('AssetService', () => {
  let service: AssetService;

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
    replaceCategories: jest.fn(),
    replaceTags: jest.fn(),
  };

  const mockAssetTypeRepo = {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByCode: jest.fn(),
  };

  const mockTagRepo = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
  };

  const mockCategoryRepo = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    findChildren: jest.fn(),
  };

  const mockTransactionRepo = {
    save: jest.fn(),
    findByAssetAndType: jest.fn(),
    updateOccurredAt: jest.fn(),
  };

  const mockAssetSnapshotRepo = {
    save: jest.fn(),
    findByAsset: jest.fn(),
    findLatestByAsset: jest.fn(),
    findLatestPerNonDisposedAsset: jest.fn(),
    findLatestPerNonDisposedAssetAsOf: jest.fn(),
    findEarliestByAsset: jest.fn(),
    updateObservedAt: jest.fn(),
  };

  const mockAssetSnapshotService = {
    create: jest.fn(),
    findByAsset: jest.fn(),
  };

  const mockPortfolioSnapshotService = {
    recalculateFromDate: jest.fn(),
  };

  const now = new Date();
  const sampleAssetType = new AssetType('at1', 'STOCKS', 'Stocks', 'FINANCIAL');
  const sampleTag = new Tag('t1', 'MyTag');
  const sampleCategory = new Category('c1', 'MyCategory', null);
  const sampleAsset = new Asset(
    'a1',
    'My Asset',
    new Decimal('10'),
    false,
    'at1',
    now,
    now,
    sampleAssetType,
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        { provide: IAssetRepository, useValue: mockAssetRepo },
        { provide: IAssetTypeRepository, useValue: mockAssetTypeRepo },
        { provide: ITagRepository, useValue: mockTagRepo },
        { provide: ICategoryRepository, useValue: mockCategoryRepo },
        { provide: ITransactionRepository, useValue: mockTransactionRepo },
        { provide: IAssetSnapshotRepository, useValue: mockAssetSnapshotRepo },
        { provide: AssetSnapshotService, useValue: mockAssetSnapshotService },
        { provide: PortfolioSnapshotService, useValue: mockPortfolioSnapshotService },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
  });

  describe('create', () => {
    it('throws AssetTypeNotFoundException when asset type does not exist', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(null);
      await expect(
        service.create({
          name: 'A',
          assetTypeId: 'at-unknown',
          acquisitionDate: '2025-01-15',
          acquisitionPrice: '100.00',
        }),
      ).rejects.toThrow(AssetTypeNotFoundException);
    });

    it('creates ACQUIRE transaction and snapshot when valid', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      mockAssetRepo.save.mockResolvedValue(sampleAsset);
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTransactionRepo.save.mockResolvedValue({});
      mockAssetSnapshotService.create.mockResolvedValue({});

      const data = {
        name: 'My Asset',
        assetTypeId: 'at1',
        acquisitionDate: '2025-01-15',
        acquisitionPrice: '100.00',
      };
      const result = await service.create(data);

      expect(mockAssetRepo.save).toHaveBeenCalledWith(data);
      expect(mockTransactionRepo.save).toHaveBeenCalledWith({
        assetId: 'a1',
        type: 'ACQUIRE',
        unitPrice: '100.00',
        quantity: '1',
        currency: 'EUR',
        occurredAt: new Date('2025-01-15'),
      });
      expect(mockAssetSnapshotService.create).toHaveBeenCalledWith({
        assetId: 'a1',
        value: '100',
        observedAt: new Date('2025-01-15'),
      });
      expect(result).toBe(sampleAsset);
    });

    it('uses provided quantity in transaction and snapshot', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      mockAssetRepo.save.mockResolvedValue(sampleAsset);
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTransactionRepo.save.mockResolvedValue({});
      mockAssetSnapshotService.create.mockResolvedValue({});

      await service.create({
        name: 'My Asset',
        assetTypeId: 'at1',
        quantity: '5',
        acquisitionDate: '2025-01-15',
        acquisitionPrice: '200.00',
      });

      expect(mockTransactionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: '5' }),
      );
      expect(mockAssetSnapshotService.create).toHaveBeenCalledWith(
        expect.objectContaining({ value: '1000' }),
      );
    });
  });

  describe('findById', () => {
    it('throws AssetNotFoundException when not found', async () => {
      mockAssetRepo.findById.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(
        AssetNotFoundException,
      );
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

  describe('update', () => {
    it('throws AssetNotFoundException when not found', async () => {
      mockAssetRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('unknown', { name: 'Updated' }),
      ).rejects.toThrow(AssetNotFoundException);
    });

    it('throws AssetTypeNotFoundException when new asset type does not exist', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockAssetTypeRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('a1', { assetTypeId: 'at-unknown' }),
      ).rejects.toThrow(AssetTypeNotFoundException);
    });

    it('calls repository.update when valid', async () => {
      mockAssetRepo.findById
        .mockResolvedValueOnce(sampleAsset)
        .mockResolvedValueOnce(sampleAsset);
      mockAssetRepo.update.mockResolvedValue(sampleAsset);
      await service.update('a1', { name: 'Updated' });
      expect(mockAssetRepo.update).toHaveBeenCalledWith('a1', {
        name: 'Updated',
      });
    });

    it('calls replaceCategories when categoryIds provided', async () => {
      mockAssetRepo.findById
        .mockResolvedValueOnce(sampleAsset)
        .mockResolvedValueOnce(sampleAsset);
      mockAssetRepo.replaceCategories.mockResolvedValue(sampleAsset);
      await service.update('a1', { categoryIds: ['c1', 'c2'] });
      expect(mockAssetRepo.replaceCategories).toHaveBeenCalledWith('a1', ['c1', 'c2']);
      expect(mockAssetRepo.update).not.toHaveBeenCalled();
    });

    it('calls replaceTags when tagIds provided', async () => {
      mockAssetRepo.findById
        .mockResolvedValueOnce(sampleAsset)
        .mockResolvedValueOnce(sampleAsset);
      mockAssetRepo.replaceTags.mockResolvedValue(sampleAsset);
      await service.update('a1', { tagIds: ['t1'] });
      expect(mockAssetRepo.replaceTags).toHaveBeenCalledWith('a1', ['t1']);
      expect(mockAssetRepo.update).not.toHaveBeenCalled();
    });

    it('updates ACQUIRE transaction and snapshot when acquisitionDate provided', async () => {
      const acquireTx = { id: 'tx1', occurredAt: new Date('2025-01-10') };
      const snapshot = { id: 'snap1', observedAt: new Date('2025-01-10') };
      mockAssetRepo.findById
        .mockResolvedValueOnce(sampleAsset)
        .mockResolvedValueOnce(sampleAsset);
      mockTransactionRepo.findByAssetAndType.mockResolvedValue(acquireTx);
      mockTransactionRepo.updateOccurredAt.mockResolvedValue({});
      mockAssetSnapshotRepo.findEarliestByAsset.mockResolvedValue(snapshot);
      mockAssetSnapshotRepo.updateObservedAt.mockResolvedValue({});
      mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);

      await service.update('a1', { acquisitionDate: '2025-01-15' });

      expect(mockTransactionRepo.updateOccurredAt).toHaveBeenCalledWith('tx1', new Date('2025-01-15'));
      expect(mockAssetSnapshotRepo.updateObservedAt).toHaveBeenCalledWith('snap1', new Date('2025-01-15'));
      expect(mockPortfolioSnapshotService.recalculateFromDate).toHaveBeenCalledWith(new Date('2025-01-10'));
    });

    it('uses min(old, new) date for recalculation when new date is earlier', async () => {
      const acquireTx = { id: 'tx1', occurredAt: new Date('2025-01-15') };
      const snapshot = { id: 'snap1' };
      mockAssetRepo.findById
        .mockResolvedValueOnce(sampleAsset)
        .mockResolvedValueOnce(sampleAsset);
      mockTransactionRepo.findByAssetAndType.mockResolvedValue(acquireTx);
      mockTransactionRepo.updateOccurredAt.mockResolvedValue({});
      mockAssetSnapshotRepo.findEarliestByAsset.mockResolvedValue(snapshot);
      mockAssetSnapshotRepo.updateObservedAt.mockResolvedValue({});
      mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);

      await service.update('a1', { acquisitionDate: '2025-01-01' });

      expect(mockPortfolioSnapshotService.recalculateFromDate).toHaveBeenCalledWith(new Date('2025-01-01'));
    });
  });

  describe('delete', () => {
    it('throws AssetNotFoundException when not found', async () => {
      mockAssetRepo.findById.mockResolvedValue(null);
      await expect(service.delete('unknown')).rejects.toThrow(
        AssetNotFoundException,
      );
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
      await expect(service.dispose('unknown', '2025-06-01', '5000.00')).rejects.toThrow(
        AssetNotFoundException,
      );
    });

    it('throws AssetAlreadyDisposedException when asset is already disposed', async () => {
      const disposedAsset = sampleAsset.dispose();
      mockAssetRepo.findById.mockResolvedValue(disposedAsset);
      await expect(service.dispose('a1', '2025-06-01', '5000.00')).rejects.toThrow(
        AssetAlreadyDisposedException,
      );
    });

    it('throws AssetAlreadyDisposedException when DISPOSE transaction exists', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTransactionRepo.findByAssetAndType.mockResolvedValue({ id: 'tx1' });
      await expect(service.dispose('a1', '2025-06-01', '5000.00')).rejects.toThrow(
        AssetAlreadyDisposedException,
      );
    });

    it('marks asset disposed, creates DISPOSE transaction, and triggers snapshot recalc', async () => {
      const disposedAsset = sampleAsset.dispose();
      mockAssetRepo.findById
        .mockResolvedValueOnce(sampleAsset)
        .mockResolvedValueOnce(disposedAsset);
      mockTransactionRepo.findByAssetAndType.mockResolvedValue(null);
      mockAssetRepo.update.mockResolvedValue(disposedAsset);
      mockTransactionRepo.save.mockResolvedValue({});
      mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);

      const result = await service.dispose('a1', '2025-06-01', '5000.00');

      expect(mockAssetRepo.update).toHaveBeenCalledWith('a1', { disposed: true });
      expect(mockTransactionRepo.save).toHaveBeenCalledWith({
        assetId: 'a1',
        type: 'DISPOSE',
        unitPrice: '5000.00',
        quantity: '10',
        currency: 'EUR',
        occurredAt: new Date('2025-06-01'),
      });
      expect(mockPortfolioSnapshotService.recalculateFromDate).toHaveBeenCalledWith(
        new Date('2025-06-01'),
      );
      expect(result.isDisposed()).toBe(true);
    });
  });

  describe('addCategory', () => {
    it('calls repository.addCategory', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      mockAssetRepo.addCategory.mockResolvedValue(sampleAsset);
      await service.addCategory('a1', 'c1');
      expect(mockAssetRepo.addCategory).toHaveBeenCalledWith('a1', 'c1');
    });

    it('throws CategoryNotFoundException when category does not exist', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockCategoryRepo.findById.mockResolvedValue(null);
      await expect(service.addCategory('a1', 'c-unknown')).rejects.toThrow(
        CategoryNotFoundException,
      );
    });

    it('throws ConflictException on duplicate', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      mockAssetRepo.addCategory.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('conflict', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      );
      await expect(service.addCategory('a1', 'c1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rethrows unknown errors', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      const unknownErr = new Error('unexpected');
      mockAssetRepo.addCategory.mockRejectedValue(unknownErr);
      await expect(service.addCategory('a1', 'c1')).rejects.toThrow(
        'unexpected',
      );
    });
  });

  describe('removeCategory', () => {
    it('calls repository.removeCategory', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      mockAssetRepo.removeCategory.mockResolvedValue(undefined);
      await service.removeCategory('a1', 'c1');
      expect(mockAssetRepo.removeCategory).toHaveBeenCalledWith('a1', 'c1');
    });

    it('throws CategoryNotFoundException when category does not exist', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockCategoryRepo.findById.mockResolvedValue(null);
      await expect(service.removeCategory('a1', 'c-unknown')).rejects.toThrow(
        CategoryNotFoundException,
      );
    });

    it('throws NotFoundException when relation does not exist', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      mockAssetRepo.removeCategory.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('not found', {
          code: 'P2025',
          clientVersion: '5.0.0',
        }),
      );
      await expect(service.removeCategory('a1', 'c1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rethrows unknown errors', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      const unknownErr = new Error('unexpected remove category');
      mockAssetRepo.removeCategory.mockRejectedValue(unknownErr);
      await expect(service.removeCategory('a1', 'c1')).rejects.toThrow(
        'unexpected remove category',
      );
    });
  });

  describe('addTag', () => {
    it('calls repository.addTag', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTagRepo.findById.mockResolvedValue(sampleTag);
      mockAssetRepo.addTag.mockResolvedValue(sampleAsset);
      await service.addTag('a1', 't1');
      expect(mockAssetRepo.addTag).toHaveBeenCalledWith('a1', 't1');
    });

    it('throws TagNotFoundException when tag does not exist', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTagRepo.findById.mockResolvedValue(null);
      await expect(service.addTag('a1', 't-unknown')).rejects.toThrow(
        TagNotFoundException,
      );
    });

    it('throws ConflictException on duplicate', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTagRepo.findById.mockResolvedValue(sampleTag);
      mockAssetRepo.addTag.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('conflict', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      );
      await expect(service.addTag('a1', 't1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rethrows unknown errors', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTagRepo.findById.mockResolvedValue(sampleTag);
      mockAssetRepo.addTag.mockRejectedValue(new Error('unexpected add tag'));
      await expect(service.addTag('a1', 't1')).rejects.toThrow(
        'unexpected add tag',
      );
    });
  });

  describe('removeTag', () => {
    it('calls repository.removeTag', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTagRepo.findById.mockResolvedValue(sampleTag);
      mockAssetRepo.removeTag.mockResolvedValue(undefined);
      await service.removeTag('a1', 't1');
      expect(mockAssetRepo.removeTag).toHaveBeenCalledWith('a1', 't1');
    });

    it('throws TagNotFoundException when tag does not exist', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTagRepo.findById.mockResolvedValue(null);
      await expect(service.removeTag('a1', 't-unknown')).rejects.toThrow(
        TagNotFoundException,
      );
    });

    it('throws NotFoundException when relation does not exist', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTagRepo.findById.mockResolvedValue(sampleTag);
      mockAssetRepo.removeTag.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('not found', {
          code: 'P2025',
          clientVersion: '5.0.0',
        }),
      );
      await expect(service.removeTag('a1', 't1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rethrows unknown errors', async () => {
      mockAssetRepo.findById.mockResolvedValue(sampleAsset);
      mockTagRepo.findById.mockResolvedValue(sampleTag);
      mockAssetRepo.removeTag.mockRejectedValue(
        new Error('unexpected remove tag'),
      );
      await expect(service.removeTag('a1', 't1')).rejects.toThrow(
        'unexpected remove tag',
      );
    });
  });
});
