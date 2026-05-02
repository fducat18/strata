import { Injectable } from '@nestjs/common';
import { Category } from '../../domain/entities/index.js';
import {
  ICategoryRepository,
  type CreateCategoryData,
} from '../../domain/ports/index.js';
import {
  CategoryNotFoundException,
  CategoryHasChildrenException,
} from '../../domain/exceptions/index.js';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async create(data: CreateCategoryData): Promise<Category> {
    if (data.parentId) {
      const parent = await this.categoryRepository.findById(data.parentId);
      if (!parent)
        throw new CategoryNotFoundException(
          `Parent category ${data.parentId} not found`,
        );
    }
    return this.categoryRepository.save(data);
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category)
      throw new CategoryNotFoundException(`Category ${id} not found`);
    return category;
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  async findChildren(parentId: string): Promise<Category[]> {
    await this.findById(parentId);
    return this.categoryRepository.findChildren(parentId);
  }

  async update(id: string, name: string): Promise<Category> {
    await this.findById(id);
    return this.categoryRepository.update(id, { name });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);

    const childrenCount = await this.categoryRepository.countChildren(id);
    if (childrenCount > 0)
      throw new CategoryHasChildrenException(
        `Category ${id} has ${childrenCount} children and cannot be deleted`,
      );

    return this.categoryRepository.delete(id);
  }
}
