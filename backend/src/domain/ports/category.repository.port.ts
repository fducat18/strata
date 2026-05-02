import { Category } from '../entities/category.entity';

export interface CreateCategoryData {
  name: string;
  parentId?: string;
}

export abstract class ICategoryRepository {
  abstract save(data: CreateCategoryData): Promise<Category>;
  abstract findById(id: string): Promise<Category | null>;
  abstract findAll(): Promise<Category[]>;
  abstract findChildren(parentId: string): Promise<Category[]>;
  abstract delete(id: string): Promise<void>;
  abstract countChildren(id: string): Promise<number>;
}
