import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller.js';
import { CategoryService } from '../../application/services/index.js';
import { Category } from '../../domain/entities/category.entity.js';

describe('CategoryController', () => {
  let controller: CategoryController;
  let categoryService: jest.Mocked<CategoryService>;

  const sampleCategory = new Category('c1', 'Financial', null);
  const childCategory = new Category('c2', 'Banking', 'c1');

  beforeEach(async () => {
    const mockCategoryService = {
      create: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      findChildren: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: mockCategoryService }],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    categoryService = module.get(CategoryService);
  });

  describe('create', () => {
    it('calls categoryService.create with dto fields and returns mapped response', async () => {
      categoryService.create.mockResolvedValue(sampleCategory);
      const dto = { name: 'Financial', parentId: undefined };
      const result = await controller.create(dto as any);
      expect(categoryService.create).toHaveBeenCalledWith({
        name: 'Financial',
        parentId: undefined,
      });
      expect(result.id).toBe('c1');
      expect(result.name).toBe('Financial');
    });

    it('creates child category with parentId', async () => {
      categoryService.create.mockResolvedValue(childCategory);
      const dto = { name: 'Banking', parentId: 'c1' };
      const result = await controller.create(dto as any);
      expect(categoryService.create).toHaveBeenCalledWith({
        name: 'Banking',
        parentId: 'c1',
      });
      expect(result.id).toBe('c2');
    });
  });

  describe('update', () => {
    it('calls categoryService.update and returns mapped response', async () => {
      const updated = new Category('c1', 'Updated', null);
      categoryService.update.mockResolvedValue(updated);
      const result = await controller.update('c1', { name: 'Updated' } as any);
      expect(categoryService.update).toHaveBeenCalledWith('c1', 'Updated');
      expect(result.id).toBe('c1');
      expect(result.name).toBe('Updated');
    });
  });

  describe('findAll', () => {
    it('returns all categories', async () => {
      categoryService.findAll.mockResolvedValue([
        sampleCategory,
        childCategory,
      ]);
      const result = await controller.findAll();
      expect(categoryService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('returns mapped category', async () => {
      categoryService.findById.mockResolvedValue(sampleCategory);
      const result = await controller.findById('c1');
      expect(categoryService.findById).toHaveBeenCalledWith('c1');
      expect(result.id).toBe('c1');
      expect(result.parentId).toBeNull();
    });
  });

  describe('delete', () => {
    it('calls categoryService.delete', async () => {
      categoryService.delete.mockResolvedValue(undefined);
      await controller.delete('c1');
      expect(categoryService.delete).toHaveBeenCalledWith('c1');
    });
  });

  describe('findChildren', () => {
    it('returns mapped children', async () => {
      categoryService.findChildren.mockResolvedValue([childCategory]);
      const result = await controller.findChildren('c1');
      expect(categoryService.findChildren).toHaveBeenCalledWith('c1');
      expect(result).toHaveLength(1);
      expect(result[0].parentId).toBe('c1');
    });
  });

  describe('response mapping with nested children', () => {
    it('maps category with children recursively', async () => {
      const childWithGrandchild = new Category('c2', 'Banking', 'c1', null, [
        new Category('c3', 'Savings', 'c2'),
      ]);
      const parentWithChild = new Category('c1', 'Financial', null, null, [
        childWithGrandchild,
      ]);
      categoryService.findById.mockResolvedValue(parentWithChild);
      const result = await controller.findById('c1');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].name).toBe('Banking');
      expect(result.children[0].children).toHaveLength(1);
      expect(result.children[0].children[0].name).toBe('Savings');
    });
  });
});
