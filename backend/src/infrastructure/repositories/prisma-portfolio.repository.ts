import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IPortfolioRepository,
  CreatePortfolioData,
  UpdatePortfolioData,
} from '../../domain/ports/portfolio.repository.port.js';
import { Portfolio } from '../../domain/entities/portfolio.entity.js';
import { Asset } from '../../domain/entities/asset.entity.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';
import { AssetSnapshot } from '../../domain/entities/asset-snapshot.entity.js';
import { Transaction } from '../../domain/entities/transaction.entity.js';
import { Category } from '../../domain/entities/category.entity.js';
import { Tag } from '../../domain/entities/tag.entity.js';
import { PortfolioSnapshot } from '../../domain/entities/portfolio-snapshot.entity.js';
import { DuplicateNameException } from '../../domain/exceptions/index.js';

@Injectable()
export class PrismaPortfolioRepository extends IPortfolioRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private readonly includeRelations = {
    assets: {
      include: {
        assetType: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        snapshots: true,
        transactions: true,
      },
    },
    snapshots: true,
  };

  private mapAssetToEntity(data: any): Asset {
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
      null,
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

  private mapToEntity(data: any): Portfolio {
    return new Portfolio(
      data.id,
      data.name,
      data.baseCurrency,
      data.createdAt,
      data.updatedAt,
      data.assets?.map((a: any) => this.mapAssetToEntity(a)) ?? [],
      data.snapshots?.map(
        (s: any) =>
          new PortfolioSnapshot(
            s.id,
            s.portfolioId,
            new Decimal(s.value.toString()),
            s.observedAt,
            s.createdAt,
          ),
      ) ?? [],
    );
  }

  async save(data: CreatePortfolioData): Promise<Portfolio> {
    try {
      const result = await this.prisma.portfolio.create({
        data: {
          name: data.name,
          baseCurrency: data.baseCurrency,
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
          `Portfolio with name '${data.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Portfolio | null> {
    const result = await this.prisma.portfolio.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findAll(): Promise<Portfolio[]> {
    const results = await this.prisma.portfolio.findMany({
      include: this.includeRelations,
    });
    return results.map((r) => this.mapToEntity(r));
  }

  async update(id: string, data: UpdatePortfolioData): Promise<Portfolio> {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.baseCurrency !== undefined)
        updateData.baseCurrency = data.baseCurrency;

      const result = await this.prisma.portfolio.update({
        where: { id },
        data: updateData,
        include: this.includeRelations,
      });
      return this.mapToEntity(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DuplicateNameException(
          `Portfolio with name '${data.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.portfolio.delete({ where: { id } });
  }
}
