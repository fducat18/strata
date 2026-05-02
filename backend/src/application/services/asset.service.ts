import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { Asset } from '../../domain/entities/index.js';
import {
  IAssetRepository,
  IAssetTypeRepository,
  ITagRepository,
  ICategoryRepository,
  ITransactionRepository,
  type CreateAssetData,
  type UpdateAssetData,
} from '../../domain/ports/index.js';
import {
  AssetNotFoundException,
  AssetTypeNotFoundException,
  TagNotFoundException,
  CategoryNotFoundException,
} from '../../domain/exceptions/index.js';
import { AssetSnapshotService } from './asset-snapshot.service.js';

@Injectable()
export class AssetService {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly assetTypeRepository: IAssetTypeRepository,
    private readonly tagRepository: ITagRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly assetSnapshotService: AssetSnapshotService,
  ) {}

  async create(data: CreateAssetData): Promise<Asset> {
    const assetType = await this.assetTypeRepository.findById(data.assetTypeId);
    if (!assetType)
      throw new AssetTypeNotFoundException(
        `Asset type ${data.assetTypeId} not found`,
      );

    const asset = await this.assetRepository.save(data);
    const qty = data.quantity ?? '1';

    await this.transactionRepository.save({
      assetId: asset.id,
      type: 'ACQUIRE',
      unitPrice: data.acquisitionPrice,
      quantity: qty,
      currency: 'EUR',
      occurredAt: new Date(data.acquisitionDate),
    });

    await this.assetSnapshotService.create({
      assetId: asset.id,
      value: new Decimal(data.acquisitionPrice).times(new Decimal(qty)).toString(),
      observedAt: new Date(data.acquisitionDate),
    });

    return this.assetRepository.findById(asset.id) as Promise<Asset>;
  }

  async findById(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findById(id);
    if (!asset) throw new AssetNotFoundException(`Asset ${id} not found`);
    return asset;
  }

  async findAll(): Promise<Asset[]> {
    return this.assetRepository.findAll();
  }

  async update(id: string, data: UpdateAssetData): Promise<Asset> {
    await this.findById(id);

    if (data.assetTypeId) {
      const assetType = await this.assetTypeRepository.findById(
        data.assetTypeId,
      );
      if (!assetType)
        throw new AssetTypeNotFoundException(
          `Asset type ${data.assetTypeId} not found`,
        );
    }

    return this.assetRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    return this.assetRepository.delete(id);
  }

  async dispose(id: string): Promise<Asset> {
    await this.findById(id);
    return this.assetRepository.dispose(id);
  }

  async addCategory(assetId: string, categoryId: string): Promise<Asset> {
    await this.findById(assetId);
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

  async removeCategory(assetId: string, categoryId: string): Promise<void> {
    await this.findById(assetId);
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

  async addTag(assetId: string, tagId: string): Promise<Asset> {
    await this.findById(assetId);
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

  async removeTag(assetId: string, tagId: string): Promise<void> {
    await this.findById(assetId);
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
