import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaCategoryRepository } from './prisma-category.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DuplicateNameException } from '../../domain/exceptions/index.js';

function makeCategoryRow(overrides: any = {}) {
  return {
    id: 'c1',
    name: 'Financial',
    parentId: null,
    parent: null,
    children: [],
    ...overrides,
  };
}

describe('PrismaCategoryRepository', () => {
  let repository: PrismaCategoryRepository;

  const mockPrismaService = {
    category: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    categoriesOnAssets: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaCategoryRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<PrismaCategoryRepository>(PrismaCategoryRepository);
  });

  describe('save', () => {
    it('creates category and maps to entity', async () => {
      mockPrismaService.category.create.mockResolvedValue(makeCategoryRow());
      const result = await repository.save({ name: 'Financial' });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Financial', parentId: null },
        }),
      );
      expect(result.id).toBe('c1');
      expect(result.name).toBe('Financial');
      expect(result.parentId).toBeNull();
    });

    it('creates child category with parentId', async () => {
      const childRow = makeCategoryRow({
        id: 'c2',
        name: 'Banking',
        parentId: 'c1',
        parent: { id: 'c1', name: 'Financial', parentId: null },
      });
      mockPrismaService.category.create.mockResolvedValue(childRow);
      const result = await repository.save({ name: 'Banking', parentId: 'c1' });
      expect(result.parentId).toBe('c1');
      expect(result.parent?.id).toBe('c1');
    });

    it('throws DuplicateNameException on P2002 error', async () => {
      mockPrismaService.category.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      );
      await expect(repository.save({ name: 'Duplicate' })).rejects.toThrow(
        DuplicateNameException,
      );
    });

    it('re-throws non-P2002 errors', async () => {
      const err = new Error('DB error');
      mockPrismaService.category.create.mockRejectedValue(err);
      await expect(repository.save({ name: 'Fail' })).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('findById', () => {
    it('returns mapped category when found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(
        makeCategoryRow(),
      );
      const result = await repository.findById('c1');
      expect(result?.id).toBe('c1');
      expect(result?.name).toBe('Financial');
    });

    it('returns null when not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      const result = await repository.findById('unknown');
      expect(result).toBeNull();
    });

    it('maps children correctly', async () => {
      const row = makeCategoryRow({
        children: [{ id: 'c2', name: 'Banking', parentId: 'c1' }],
      });
      mockPrismaService.category.findUnique.mockResolvedValue(row);
      const result = await repository.findById('c1');
      expect(result?.children).toHaveLength(1);
      expect(result?.children[0].name).toBe('Banking');
    });
  });

  describe('findAll', () => {
    it('returns all mapped categories', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        makeCategoryRow(),
      ]);
      const result = await repository.findAll();
      expect(result).toHaveLength(1);
    });

    it('returns empty array when none', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findChildren', () => {
    it('filters by parentId', async () => {
      const childRow = makeCategoryRow({
        id: 'c2',
        name: 'Banking',
        parentId: 'c1',
      });
      mockPrismaService.category.findMany.mockResolvedValue([childRow]);
      const result = await repository.findChildren('c1');
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: 'c1' },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('calls prisma.category.delete', async () => {
      mockPrismaService.category.delete.mockResolvedValue(undefined);
      await repository.delete('c1');
      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
    });
  });

  describe('countAssets', () => {
    it('counts categoriesOnAssets', async () => {
      mockPrismaService.categoriesOnAssets.count.mockResolvedValue(3);
      const result = await repository.countAssets('c1');
      expect(result).toBe(3);
    });
  });

  describe('countChildren', () => {
    it('counts child categories', async () => {
      mockPrismaService.category.count.mockResolvedValue(2);
      const result = await repository.countChildren('c1');
      expect(result).toBe(2);
    });
  });
});
