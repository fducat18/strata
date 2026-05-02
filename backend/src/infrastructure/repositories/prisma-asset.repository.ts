import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IAssetRepository,
  CreateAssetData,
  UpdateAssetData,
} from '../../domain/ports/asset.repository.port.js';
import { Asset } from '../../domain/entities/asset.entity.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';
import { AssetSnapshot } from '../../domain/entities/asset-snapshot.entity.js';
import { Transaction } from '../../domain/entities/transaction.entity.js';
import { Category } from '../../domain/entities/category.entity.js';
import { Tag } from '../../domain/entities/tag.entity.js';

type AssetWithRelations = Prisma.AssetGetPayload<{
  include: {
    assetType: true;
    categories: { include: { category: true } };
    tags: { include: { tag: true } };
    snapshots: true;
    transactions: true;
  };
}>;

@Injectable()
export class PrismaAssetRepository extends IAssetRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private readonly includeRelations = {
    assetType: true,
    categories: { include: { category: true } },
    tags: { include: { tag: true } },
    snapshots: true,
    transactions: true,
  };

  private mapToEntity(data: AssetWithRelations): Asset {
    return new Asset(
      data.id,
      data.name,
      data.quantity != null ? new Decimal(data.quantity.toString()) : null,
      data.disposed,
      data.assetTypeId,
      data.createdAt,
      data.updatedAt,
      data.assetType
        ? new AssetType(
            data.assetType.id,
            data.assetType.code,
            data.assetType.label,
            data.assetType.group,
          )
        : null,
      data.snapshots?.map(
        (s) =>
          new AssetSnapshot(
            s.id,
            s.assetId,
            new Decimal(s.value.toString()),
            s.observedAt,
            s.createdAt,
          ),
      ) ?? [],
      data.transactions?.map(
        (t) =>
          new Transaction(
            t.id,
            t.assetId,
            t.type,
            new Decimal(t.unitPrice.toString()),
            new Decimal(t.quantity.toString()),
            t.currency,
            t.occurredAt,
            t.createdAt,
          ),
      ) ?? [],
      data.categories?.map(
        (c) =>
          new Category(c.category.id, c.category.name, c.category.parentId),
      ) ?? [],
      data.tags?.map((t) => new Tag(t.tag.id, t.tag.name)) ?? [],
    );
  }

  async save(data: CreateAssetData): Promise<Asset> {
    const result = await this.prisma.asset.create({
      data: {
        name: data.name,
        assetTypeId: data.assetTypeId,
        quantity: data.quantity != null ? new Decimal(data.quantity) : null,
      },
      include: this.includeRelations,
    });
    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<Asset | null> {
    const result = await this.prisma.asset.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findAll(): Promise<Asset[]> {
    const results = await this.prisma.asset.findMany({
      include: this.includeRelations,
    });
    return results.map((r) => this.mapToEntity(r));
  }

  async update(id: string, data: UpdateAssetData): Promise<Asset> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.assetTypeId !== undefined)
      updateData.assetTypeId = data.assetTypeId;
    if (data.quantity !== undefined)
      updateData.quantity = new Decimal(data.quantity);
    if (data.disposed !== undefined) updateData.disposed = data.disposed;

    const result = await this.prisma.asset.update({
      where: { id },
      data: updateData,
      include: this.includeRelations,
    });
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.asset.delete({ where: { id } });
  }

  async dispose(id: string): Promise<Asset> {
    const result = await this.prisma.asset.update({
      where: { id },
      data: { disposed: true },
      include: this.includeRelations,
    });
    return this.mapToEntity(result);
  }

  async addCategory(assetId: string, categoryId: string): Promise<Asset> {
    return this.prisma.$transaction(async (tx) => {
      await this.attachCategory(tx, assetId, categoryId);
      return this.reloadAsset(tx, assetId);
    });
  }

  async removeCategory(assetId: string, categoryId: string): Promise<void> {
    await this.prisma.categoriesOnAssets.delete({
      where: { assetId_categoryId: { assetId, categoryId } },
    });
  }

  async addTag(assetId: string, tagId: string): Promise<Asset> {
    return this.prisma.$transaction(async (tx) => {
      await this.attachTag(tx, assetId, tagId);
      return this.reloadAsset(tx, assetId);
    });
  }

  async removeTag(assetId: string, tagId: string): Promise<void> {
    await this.prisma.tagsOnAssets.delete({
      where: { assetId_tagId: { assetId, tagId } },
    });
  }

  async replaceCategories(assetId: string, categoryIds: string[]): Promise<Asset> {
    return this.prisma.$transaction(async (tx) => {
      await tx.categoriesOnAssets.deleteMany({ where: { assetId } });
      if (categoryIds.length > 0) {
        await tx.categoriesOnAssets.createMany({
          data: categoryIds.map((categoryId) => ({ assetId, categoryId })),
        });
      }
      return this.reloadAsset(tx, assetId);
    });
  }

  async replaceTags(assetId: string, tagIds: string[]): Promise<Asset> {
    return this.prisma.$transaction(async (tx) => {
      await tx.tagsOnAssets.deleteMany({ where: { assetId } });
      if (tagIds.length > 0) {
        await tx.tagsOnAssets.createMany({
          data: tagIds.map((tagId) => ({ assetId, tagId })),
        });
      }
      return this.reloadAsset(tx, assetId);
    });
  }

  private async attachCategory(
    tx: Prisma.TransactionClient,
    assetId: string,
    categoryId: string,
  ): Promise<void> {
    await tx.categoriesOnAssets.create({ data: { assetId, categoryId } });
  }

  private async attachTag(
    tx: Prisma.TransactionClient,
    assetId: string,
    tagId: string,
  ): Promise<void> {
    await tx.tagsOnAssets.create({ data: { assetId, tagId } });
  }

  private async reloadAsset(
    tx: Prisma.TransactionClient,
    assetId: string,
  ): Promise<Asset> {
    const result = await tx.asset.findUniqueOrThrow({
      where: { id: assetId },
      include: this.includeRelations,
    });
    return this.mapToEntity(result);
  }
}
