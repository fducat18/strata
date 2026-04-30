import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service.js';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';
import { Category } from '../../domain/entities/category.entity.js';
import {
  CategoryNotFoundException,
  CategoryHasChildrenException,
} from '../../domain/exceptions/domain.exceptions.js';

describe('CategoryService', () => {
  let service: CategoryService;

  const mockCategoryRepo = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findChildren: jest.fn(),
    delete: jest.fn(),
    countAssets: jest.fn(),
    countChildren: jest.fn(),
  };

  const sampleCategory = new Category('c1', 'Financial', null);
  const childCategory = new Category('c2', 'Banking', 'c1');

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: ICategoryRepository, useValue: mockCategoryRepo },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  describe('create', () => {
    it('creates a root category', async () => {
      mockCategoryRepo.save.mockResolvedValue(sampleCategory);
      const result = await service.create({ name: 'Financial' });
      expect(mockCategoryRepo.save).toHaveBeenCalledWith({ name: 'Financial' });
      expect(result).toBe(sampleCategory);
    });

    it('throws CategoryNotFoundException when parent does not exist', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);
      await expect(
        service.create({ name: 'Child', parentId: 'unknown' }),
      ).rejects.toThrow(CategoryNotFoundException);
    });

    it('creates a child category when parent exists', async () => {
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      mockCategoryRepo.save.mockResolvedValue(childCategory);
      const result = await service.create({ name: 'Banking', parentId: 'c1' });
      expect(result).toBe(childCategory);
    });
  });

  describe('findById', () => {
    it('returns category when found', async () => {
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      const result = await service.findById('c1');
      expect(result).toBe(sampleCategory);
    });

    it('throws CategoryNotFoundException when not found', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(CategoryNotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns all categories', async () => {
      mockCategoryRepo.findAll.mockResolvedValue([sampleCategory, childCategory]);
      const result = await service.findAll();
      expect(result).toEqual([sampleCategory, childCategory]);
    });
  });

  describe('findChildren', () => {
    it('throws CategoryNotFoundException when parent not found', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);
      await expect(service.findChildren('unknown')).rejects.toThrow(CategoryNotFoundException);
    });

    it('returns children for existing category', async () => {
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      mockCategoryRepo.findChildren.mockResolvedValue([childCategory]);
      const result = await service.findChildren('c1');
      expect(result).toEqual([childCategory]);
    });
  });

  describe('delete', () => {
    it('throws CategoryNotFoundException when not found', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);
      await expect(service.delete('unknown')).rejects.toThrow(CategoryNotFoundException);
    });

    it('throws CategoryHasChildrenException when category has children', async () => {
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      mockCategoryRepo.countChildren.mockResolvedValue(3);
      await expect(service.delete('c1')).rejects.toThrow(CategoryHasChildrenException);
    });

    it('deletes category when no children', async () => {
      mockCategoryRepo.findById.mockResolvedValue(sampleCategory);
      mockCategoryRepo.countChildren.mockResolvedValue(0);
      mockCategoryRepo.delete.mockResolvedValue(undefined);
      await service.delete('c1');
      expect(mockCategoryRepo.delete).toHaveBeenCalledWith('c1');
    });
  });
});
