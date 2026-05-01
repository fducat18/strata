import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { PrismaAssetRepository } from './prisma-asset.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

function makeAssetRow(overrides: any = {}) {
  const now = new Date('2024-01-01T00:00:00.000Z');
  return {
    id: 'a1',
    name: 'My Asset',
    quantity: new Decimal('10'),
    disposed: false,
    assetTypeId: 'at1',
    createdAt: now,
    updatedAt: now,
    assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks' },
    snapshots: [],
    transactions: [],
    categories: [],
    tags: [],
    ...overrides,
  };
}

describe('PrismaAssetRepository', () => {
  let repository: PrismaAssetRepository;
  let prismaService: any;

  const mockTx = {
    asset: {
      findUniqueOrThrow: jest.fn(),
    },
    categoriesOnAssets: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    tagsOnAssets: {
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPrismaService = {
    asset: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaAssetRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<PrismaAssetRepository>(PrismaAssetRepository);
    prismaService = module.get(PrismaService);
  });

  describe('mapToEntity (via save)', () => {
    it('maps quantity Decimal to Decimal entity field', async () => {
      const row = makeAssetRow({ quantity: new Decimal('10.5') });
      mockPrismaService.asset.create.mockResolvedValue(row);
      const asset = await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
        quantity: '10.5',
      });
      expect(asset.quantity).toBeInstanceOf(Decimal);
      expect(asset.quantity?.toString()).toBe('10.5');
    });

    it('maps null quantity to null', async () => {
      const row = makeAssetRow({ quantity: null });
      mockPrismaService.asset.create.mockResolvedValue(row);
      const asset = await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
      });
      expect(asset.quantity).toBeNull();
    });

    it('maps quantity of zero (0) to Decimal(0), not null', async () => {
      const row = makeAssetRow({ quantity: new Decimal('0') });
      mockPrismaService.asset.create.mockResolvedValue(row);
      const asset = await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
        quantity: '0',
      });
      // Zero quantity should NOT be coerced to null
      expect(asset.quantity).toBeInstanceOf(Decimal);
      expect(asset.quantity?.toNumber()).toBe(0);
    });

    it('maps assetType relation', async () => {
      const row = makeAssetRow();
      mockPrismaService.asset.create.mockResolvedValue(row);
      const asset = await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
      });
      expect(asset.assetType).not.toBeNull();
      expect(asset.assetType?.code).toBe('STOCKS');
    });

    it('maps null assetType to null', async () => {
      const row = makeAssetRow({ assetType: null });
      mockPrismaService.asset.create.mockResolvedValue(row);
      const asset = await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
      });
      expect(asset.assetType).toBeNull();
    });

    it('maps snapshots array', async () => {
      const now = new Date('2024-01-01T00:00:00.000Z');
      const row = makeAssetRow({
        snapshots: [
          {
            id: 's1',
            assetId: 'a1',
            value: new Decimal('500'),
            observedAt: now,
            createdAt: now,
          },
        ],
      });
      mockPrismaService.asset.create.mockResolvedValue(row);
      const asset = await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
      });
      expect(asset.snapshots).toHaveLength(1);
      expect(asset.snapshots[0].value).toBeInstanceOf(Decimal);
    });

    it('maps categories array', async () => {
      const row = makeAssetRow({
        categories: [
          { category: { id: 'c1', name: 'Financial', parentId: null } },
        ],
      });
      mockPrismaService.asset.create.mockResolvedValue(row);
      const asset = await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
      });
      expect(asset.categories).toHaveLength(1);
      expect(asset.categories[0].name).toBe('Financial');
    });

    it('maps tags array', async () => {
      const row = makeAssetRow({
        tags: [{ tag: { id: 't1', name: 'crypto' } }],
      });
      mockPrismaService.asset.create.mockResolvedValue(row);
      const asset = await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
      });
      expect(asset.tags).toHaveLength(1);
      expect(asset.tags[0].name).toBe('crypto');
    });

    it('maps transactions array', async () => {
      const now = new Date('2024-01-01T00:00:00.000Z');
      const row = makeAssetRow({
        transactions: [
          {
            id: 'tx1',
            assetId: 'a1',
            type: 'ACQUIRE',
            unitPrice: new Decimal('100'),
            quantity: new Decimal('10'),
            currency: 'EUR',
            occurredAt: now,
            createdAt: now,
          },
        ],
      });
      mockPrismaService.asset.create.mockResolvedValue(row);
      const asset = await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
      });
      expect(asset.transactions).toHaveLength(1);
      expect(asset.transactions[0].type).toBe('ACQUIRE');
      expect(asset.transactions[0].unitPrice).toBeInstanceOf(Decimal);
    });
  });

  describe('save', () => {
    it('passes quantity as Decimal when provided', async () => {
      const row = makeAssetRow({ quantity: new Decimal('5') });
      mockPrismaService.asset.create.mockResolvedValue(row);
      await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
        quantity: '5',
      });
      expect(mockPrismaService.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: expect.any(Decimal),
          }),
        }),
      );
    });

    it('passes null quantity when not provided', async () => {
      const row = makeAssetRow({ quantity: null });
      mockPrismaService.asset.create.mockResolvedValue(row);
      await repository.save({
        name: 'My Asset',
        assetTypeId: 'at1',
      });
      expect(mockPrismaService.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: null }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('returns null when not found', async () => {
      mockPrismaService.asset.findUnique.mockResolvedValue(null);
      const result = await repository.findById('unknown');
      expect(result).toBeNull();
    });

    it('returns entity when found', async () => {
      mockPrismaService.asset.findUnique.mockResolvedValue(makeAssetRow());
      const result = await repository.findById('a1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('a1');
    });
  });

  describe('findAll', () => {
    it('returns empty array when no assets', async () => {
      mockPrismaService.asset.findMany.mockResolvedValue([]);
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });

    it('returns mapped assets', async () => {
      mockPrismaService.asset.findMany.mockResolvedValue([makeAssetRow()]);
      const result = await repository.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates asset with provided fields', async () => {
      mockPrismaService.asset.update.mockResolvedValue(
        makeAssetRow({ name: 'Updated' }),
      );
      const result = await repository.update('a1', { name: 'Updated' });
      expect(mockPrismaService.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'a1' },
          data: { name: 'Updated' },
        }),
      );
      expect(result.name).toBe('Updated');
    });

    it('updates assetTypeId when provided', async () => {
      mockPrismaService.asset.update.mockResolvedValue(
        makeAssetRow({ assetTypeId: 'at2' }),
      );
      await repository.update('a1', { assetTypeId: 'at2' });
      expect(mockPrismaService.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ assetTypeId: 'at2' }),
        }),
      );
    });

    it('updates quantity as Decimal when provided', async () => {
      mockPrismaService.asset.update.mockResolvedValue(
        makeAssetRow({ quantity: new Decimal('5') }),
      );
      await repository.update('a1', { quantity: '5' });
      expect(mockPrismaService.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: expect.any(Decimal) }),
        }),
      );
    });
  });

  describe('delete', () => {
    it('calls prisma.asset.delete with correct id', async () => {
      mockPrismaService.asset.delete.mockResolvedValue(undefined);
      await repository.delete('a1');
      expect(mockPrismaService.asset.delete).toHaveBeenCalledWith({
        where: { id: 'a1' },
      });
    });
  });

  describe('dispose', () => {
    it('sets disposed to true', async () => {
      mockPrismaService.asset.update.mockResolvedValue(
        makeAssetRow({ disposed: true }),
      );
      const result = await repository.dispose('a1');
      expect(mockPrismaService.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'a1' },
          data: { disposed: true },
        }),
      );
      expect(result.disposed).toBe(true);
    });
  });

  describe('addTag', () => {
    it('runs within a transaction', async () => {
      const reloadedRow = makeAssetRow({
        tags: [{ tag: { id: 't1', name: 'crypto' } }],
      });
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        mockTx.asset.findUniqueOrThrow.mockResolvedValue(reloadedRow);
        return fn(mockTx);
      });
      const result = await repository.addTag('a1', 't1');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.tags).toHaveLength(1);
    });
  });

  describe('removeTag', () => {
    it('runs within a transaction', async () => {
      const reloadedRow = makeAssetRow({ tags: [] });
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        mockTx.asset.findUniqueOrThrow.mockResolvedValue(reloadedRow);
        return fn(mockTx);
      });
      const result = await repository.removeTag('a1', 't1');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.tags).toHaveLength(0);
    });
  });

  describe('addCategory', () => {
    it('runs within a transaction', async () => {
      const reloadedRow = makeAssetRow({
        categories: [
          { category: { id: 'c1', name: 'Financial', parentId: null } },
        ],
      });
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        mockTx.asset.findUniqueOrThrow.mockResolvedValue(reloadedRow);
        return fn(mockTx);
      });
      const result = await repository.addCategory('a1', 'c1');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.categories).toHaveLength(1);
    });
  });

  describe('removeCategory', () => {
    it('runs within a transaction', async () => {
      const reloadedRow = makeAssetRow({ categories: [] });
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        mockTx.asset.findUniqueOrThrow.mockResolvedValue(reloadedRow);
        return fn(mockTx);
      });
      const result = await repository.removeCategory('a1', 'c1');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.categories).toHaveLength(0);
    });
  });
});
