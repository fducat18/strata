import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ICategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../domain/ports/category.repository.port.js';
import { Category } from '../../domain/entities/category.entity.js';
import { DuplicateNameException } from '../../domain/exceptions/index.js';

type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: { parent: true; children: true };
}>;

@Injectable()
export class PrismaCategoryRepository extends ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private readonly includeRelations = {
    parent: true,
    children: true,
  };

  private mapToEntity(data: CategoryWithRelations): Category {
    return new Category(
      data.id,
      data.name,
      data.parentId,
      data.parent
        ? new Category(data.parent.id, data.parent.name, data.parent.parentId)
        : null,
      data.children?.map((c) => new Category(c.id, c.name, c.parentId)) ?? [],
    );
  }

  async save(data: CreateCategoryData): Promise<Category> {
    try {
      const result = await this.prisma.category.create({
        data: {
          name: data.name,
          parentId: data.parentId ?? null,
        },
        include: this.includeRelations,
      });
      return this.mapToEntity(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DuplicateNameException(
          `Category with name '${data.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    try {
      const result = await this.prisma.category.update({
        where: { id },
        data: { name: data.name },
        include: this.includeRelations,
      });
      return this.mapToEntity(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DuplicateNameException(
          `Category with name '${data.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Category | null> {
    const result = await this.prisma.category.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findAll(): Promise<Category[]> {
    const results = await this.prisma.category.findMany({
      include: this.includeRelations,
    });
    return results.map((r) => this.mapToEntity(r));
  }

  async findChildren(parentId: string): Promise<Category[]> {
    const results = await this.prisma.category.findMany({
      where: { parentId },
      include: this.includeRelations,
    });
    return results.map((r) => this.mapToEntity(r));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  async countChildren(id: string): Promise<number> {
    return this.prisma.category.count({
      where: { parentId: id },
    });
  }
}
