import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Asset } from '../../../domain/entities/index.js';
import {
  IAssetRepository,
  ITagRepository,
} from '../../../domain/ports/index.js';
import {
  AssetNotFoundException,
  TagNotFoundException,
} from '../../../domain/exceptions/index.js';

/**
 * Pre-validates that both Asset and Tag exist before creating the join row.
 * Maps Prisma P2002 (already linked) → 409 Conflict.
 */
@Injectable()
export class AddTagToAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly tagRepository: ITagRepository,
  ) {}

  async execute(assetId: string, tagId: string): Promise<Asset> {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) throw new AssetNotFoundException(`Asset ${assetId} not found`);

    const tag = await this.tagRepository.findById(tagId);
    if (!tag) throw new TagNotFoundException(`Tag ${tagId} not found`);

    try {
      return await this.assetRepository.addTag(assetId, tagId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Tag ${tagId} is already attached to asset ${assetId}`,
        );
      }
      throw error;
    }
  }
}
