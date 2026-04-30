import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Asset } from '../../../domain/entities/index.js';
import {
  IAssetRepository,
  ICategoryRepository,
} from '../../../domain/ports/index.js';
import {
  AssetNotFoundException,
  CategoryNotFoundException,
} from '../../../domain/exceptions/index.js';

@Injectable()
export class AddCategoryToAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(assetId: string, categoryId: string): Promise<Asset> {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) throw new AssetNotFoundException(`Asset ${assetId} not found`);

    const category = await this.categoryRepository.findById(categoryId);
    if (!category)
      throw new CategoryNotFoundException(`Category ${categoryId} not found`);

    try {
      return await this.assetRepository.addCategory(assetId, categoryId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Category ${categoryId} is already attached to asset ${assetId}`,
        );
      }
      throw error;
    }
  }
}
