import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IAssetRepository,
  CreateAssetData,
  UpdateAssetData,
} from '../../domain/ports/asset.repository.port.js';
import { Asset } from '../../domain/entities/asset.entity.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';
import { Portfolio } from '../../domain/entities/portfolio.entity.js';
import { AssetSnapshot } from '../../domain/entities/asset-snapshot.entity.js';
import { Transaction } from '../../domain/entities/transaction.entity.js';
import { Category } from '../../domain/entities/category.entity.js';
import { Tag } from '../../domain/entities/tag.entity.js';

@Injectable()
export class PrismaAssetRepository extends IAssetRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private readonly includeRelations = {
    assetType: true,
    portfolio: true,
    categories: { include: { category: true } },
    tags: { include: { tag: true } },
    snapshots: true,
    transactions: true,
  };

  private mapToEntity(data: any): Asset {
    return new Asset(
      data.id,
      data.name,
      data.quantity ? new Decimal(data.quantity.toString()) : null,
      data.disposed,
      data.portfolioId,
      data.assetTypeId,
      data.createdAt,
      data.updatedAt,
      data.assetType
        ? new AssetType(
            data.assetType.id,
            data.assetType.code,
            data.assetType.label,
          )
        : null,
      data.portfolio
        ? new Portfolio(
            data.portfolio.id,
            data.portfolio.name,
            data.portfolio.baseCurrency,
            data.portfolio.createdAt,
            data.portfolio.updatedAt,
          )
        : null,
      data.snapshots?.map(
        (s: any) =>
          new AssetSnapshot(
            s.id,
            s.assetId,
            new Decimal(s.value.toString()),
            s.observedAt,
            s.createdAt,
          ),
      ) ?? [],
      data.transactions?.map(
        (t: any) =>
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
        (c: any) =>
          new Category(c.category.id, c.category.name, c.category.parentId),
      ) ?? [],
      data.tags?.map((t: any) => new Tag(t.tag.id, t.tag.name)) ?? [],
    );
  }

  async save(data: CreateAssetData): Promise<Asset> {
    const result = await this.prisma.asset.create({
      data: {
        name: data.name,
        portfolioId: data.portfolioId,
        assetTypeId: data.assetTypeId,
        quantity: data.quantity ? new Decimal(data.quantity) : null,
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

  async findByPortfolio(portfolioId: string): Promise<Asset[]> {
    const results = await this.prisma.asset.findMany({
      where: { portfolioId },
      include: this.includeRelations,
    });
    return results.map((r) => this.mapToEntity(r));
  }

  async update(id: string, data: UpdateAssetData): Promise<Asset> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.assetTypeId !== undefined) updateData.assetTypeId = data.assetTypeId;
    if (data.quantity !== undefined)
      updateData.quantity = new Decimal(data.quantity);

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
    await this.prisma.categoriesOnAssets.create({
      data: { assetId, categoryId },
    });
    const result = await this.prisma.asset.findUniqueOrThrow({
      where: { id: assetId },
      include: this.includeRelations,
    });
    return this.mapToEntity(result);
  }

  async removeCategory(assetId: string, categoryId: string): Promise<Asset> {
    await this.prisma.categoriesOnAssets.delete({
      where: { assetId_categoryId: { assetId, categoryId } },
    });
    const result = await this.prisma.asset.findUniqueOrThrow({
      where: { id: assetId },
      include: this.includeRelations,
    });
    return this.mapToEntity(result);
  }

  async addTag(assetId: string, tagId: string): Promise<Asset> {
    await this.prisma.tagsOnAssets.create({
      data: { assetId, tagId },
    });
    const result = await this.prisma.asset.findUniqueOrThrow({
      where: { id: assetId },
      include: this.includeRelations,
    });
    return this.mapToEntity(result);
  }

  async removeTag(assetId: string, tagId: string): Promise<Asset> {
    await this.prisma.tagsOnAssets.delete({
      where: { assetId_tagId: { assetId, tagId } },
    });
    const result = await this.prisma.asset.findUniqueOrThrow({
      where: { id: assetId },
      include: this.includeRelations,
    });
    return this.mapToEntity(result);
  }
}
