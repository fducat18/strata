import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IAssetRepository,
  ICategoryRepository,
} from '../../../domain/ports/index.js';
import {
  AssetNotFoundException,
  CategoryNotFoundException,
} from '../../../domain/exceptions/index.js';

@Injectable()
export class RemoveCategoryFromAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(assetId: string, categoryId: string): Promise<void> {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) throw new AssetNotFoundException(`Asset ${assetId} not found`);

    const category = await this.categoryRepository.findById(categoryId);
    if (!category)
      throw new CategoryNotFoundException(`Category ${categoryId} not found`);

    try {
      await this.assetRepository.removeCategory(assetId, categoryId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Category ${categoryId} is not attached to asset ${assetId}`,
        );
      }
      throw error;
    }
  }
}
