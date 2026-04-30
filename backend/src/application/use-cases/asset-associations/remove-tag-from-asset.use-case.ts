import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IAssetRepository,
  ITagRepository,
} from '../../../domain/ports/index.js';
import {
  AssetNotFoundException,
  TagNotFoundException,
} from '../../../domain/exceptions/index.js';

@Injectable()
export class RemoveTagFromAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly tagRepository: ITagRepository,
  ) {}

  async execute(assetId: string, tagId: string): Promise<void> {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) throw new AssetNotFoundException(`Asset ${assetId} not found`);

    const tag = await this.tagRepository.findById(tagId);
    if (!tag) throw new TagNotFoundException(`Tag ${tagId} not found`);

    try {
      await this.assetRepository.removeTag(assetId, tagId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Tag ${tagId} is not attached to asset ${assetId}`,
        );
      }
      throw error;
    }
  }
}
