import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { Decimal } from 'decimal.js';

/**
 * JSON backup format (schemaVersion = "1"):
 *
 * {
 *   schemaVersion: "1",
 *   exportedAt: <ISO timestamp>,
 *   data: {
 *     assetTypes:         AssetType[],
 *     portfolios:         Portfolio[],
 *     categories:         Category[],
 *     tags:               Tag[],
 *     assets:             Asset[],
 *     assetSnapshots:     AssetSnapshot[],
 *     portfolioSnapshots: PortfolioSnapshot[],
 *     transactions:       Transaction[],
 *     categoriesOnAssets: { assetId, categoryId }[],
 *     tagsOnAssets:       { assetId, tagId }[],
 *   }
 * }
 *
 * All `Decimal` values are serialized as decimal strings (no scientific notation).
 * `Date` values are serialized as ISO 8601.
 */
export const BACKUP_SCHEMA_VERSION = '1';

export interface BackupPayload {
  schemaVersion: string;
  exportedAt: string;
  data: BackupData;
}

export interface BackupData {
  assetTypes: any[];
  portfolios: any[];
  categories: any[];
  tags: any[];
  assets: any[];
  assetSnapshots: any[];
  portfolioSnapshots: any[];
  transactions: any[];
  categoriesOnAssets: any[];
  tagsOnAssets: any[];
}

export interface RestoreCounts {
  schemaVersion: string;
  mode: 'replace' | 'merge';
  counts: Record<keyof BackupData, number>;
}

type RestoreMode = 'replace' | 'merge';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Export ──────────────────────────────────────────────────────────

  async exportBackup(): Promise<BackupPayload> {
    const data = await this.collectAll();
    return {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: this.serialize(data),
    };
  }

  private async collectAll(): Promise<BackupData> {
    const [
      assetTypes,
      portfolios,
      categories,
      tags,
      assets,
      assetSnapshots,
      portfolioSnapshots,
      transactions,
      categoriesOnAssets,
      tagsOnAssets,
    ] = await Promise.all([
      this.prisma.assetType.findMany(),
      this.prisma.portfolio.findMany(),
      this.prisma.category.findMany(),
      this.prisma.tag.findMany(),
      this.prisma.asset.findMany(),
      this.prisma.assetSnapshot.findMany(),
      this.prisma.portfolioSnapshot.findMany(),
      this.prisma.transaction.findMany(),
      this.prisma.categoriesOnAssets.findMany(),
      this.prisma.tagsOnAssets.findMany(),
    ]);
    return {
      assetTypes,
      portfolios,
      categories,
      tags,
      assets,
      assetSnapshots,
      portfolioSnapshots,
      transactions,
      categoriesOnAssets,
      tagsOnAssets,
    };
  }

  private serialize(data: BackupData): BackupData {
    // Convert Decimal/Date to JSON-stable representations.
    return JSON.parse(
      JSON.stringify(data, (_k, v) => {
        if (v instanceof Decimal) return v.toString();
        if (
          v &&
          typeof v === 'object' &&
          typeof v.toFixed === 'function' &&
          typeof v.d === 'object'
        ) {
          // Prisma Decimal (decimal.js-light)
          return v.toString();
        }
        return v;
      }),
    ) as BackupData;
  }

  // ─── Import ──────────────────────────────────────────────────────────

  async importBackup(payload: {
    schemaVersion: string;
    data: any;
    mode?: RestoreMode;
  }): Promise<RestoreCounts> {
    if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION) {
      throw new BadRequestException(
        `Unsupported backup schemaVersion '${payload.schemaVersion}', expected '${BACKUP_SCHEMA_VERSION}'`,
      );
    }
    const mode: RestoreMode = payload.mode ?? 'replace';
    const data = this.coerceData(payload.data);

    const counts = await this.prisma.$transaction(async (tx) => {
      if (mode === 'replace') {
        await this.wipeAll(tx);
      }
      return this.insertAll(tx, data);
    });

    this.logger.log(
      `Restore complete (mode=${mode}); inserted ${JSON.stringify(counts)}`,
    );
    return { schemaVersion: BACKUP_SCHEMA_VERSION, mode, counts };
  }

  private coerceData(raw: any): BackupData {
    const empty: BackupData = {
      assetTypes: [],
      portfolios: [],
      categories: [],
      tags: [],
      assets: [],
      assetSnapshots: [],
      portfolioSnapshots: [],
      transactions: [],
      categoriesOnAssets: [],
      tagsOnAssets: [],
    };
    if (!raw || typeof raw !== 'object') return empty;
    return { ...empty, ...raw };
  }

  /**
   * Delete in dependency order: leaf join tables first, then snapshots/txn,
   * then assets, then top-level reference tables.
   */
  private async wipeAll(tx: any): Promise<void> {
    await tx.tagsOnAssets.deleteMany({});
    await tx.categoriesOnAssets.deleteMany({});
    await tx.transaction.deleteMany({});
    await tx.assetSnapshot.deleteMany({});
    await tx.portfolioSnapshot.deleteMany({});
    await tx.asset.deleteMany({});
    await tx.tag.deleteMany({});
    // Categories may self-reference via parentId; delete leaves first.
    await tx.category.deleteMany({ where: { parentId: { not: null } } });
    await tx.category.deleteMany({});
    await tx.portfolio.deleteMany({});
    await tx.assetType.deleteMany({});
  }

  private async insertAll(
    tx: any,
    data: BackupData,
  ): Promise<Record<keyof BackupData, number>> {
    const counts: Record<keyof BackupData, number> = {
      assetTypes: await this.upsertAll(tx.assetType, data.assetTypes, 'id'),
      portfolios: await this.upsertAll(tx.portfolio, data.portfolios, 'id'),
      categories: await this.upsertCategories(tx, data.categories),
      tags: await this.upsertAll(tx.tag, data.tags, 'id'),
      assets: await this.upsertAll(tx.asset, data.assets, 'id'),
      assetSnapshots: await this.upsertAll(
        tx.assetSnapshot,
        data.assetSnapshots,
        'id',
      ),
      portfolioSnapshots: await this.upsertAll(
        tx.portfolioSnapshot,
        data.portfolioSnapshots,
        'id',
      ),
      transactions: await this.upsertAll(
        tx.transaction,
        data.transactions,
        'id',
      ),
      categoriesOnAssets: await this.upsertJoin(
        tx.categoriesOnAssets,
        data.categoriesOnAssets,
        ['assetId', 'categoryId'],
      ),
      tagsOnAssets: await this.upsertJoin(tx.tagsOnAssets, data.tagsOnAssets, [
        'assetId',
        'tagId',
      ]),
    };
    return counts;
  }

  private async upsertAll(
    delegate: any,
    rows: any[],
    pk: string,
  ): Promise<number> {
    let n = 0;
    for (const row of rows ?? []) {
      const value = this.normalizeRow(row);
      await delegate.upsert({
        where: { [pk]: value[pk] },
        update: value,
        create: value,
      });
      n++;
    }
    return n;
  }

  /**
   * Categories self-reference via parentId — insert parents first, then children.
   */
  private async upsertCategories(tx: any, rows: any[]): Promise<number> {
    const parents = (rows ?? []).filter((r) => !r.parentId);
    const children = (rows ?? []).filter((r) => r.parentId);
    let n = 0;
    for (const r of [...parents, ...children]) {
      const value = this.normalizeRow(r);
      await tx.category.upsert({
        where: { id: value.id },
        update: value,
        create: value,
      });
      n++;
    }
    return n;
  }

  private async upsertJoin(
    delegate: any,
    rows: any[],
    keys: string[],
  ): Promise<number> {
    let n = 0;
    for (const row of rows ?? []) {
      const value = this.normalizeRow(row);
      const where = keys.reduce<Record<string, any>>((acc, k) => {
        acc[k] = value[k];
        return acc;
      }, {});
      const existing = await delegate.findFirst({ where });
      if (!existing) {
        await delegate.create({ data: value });
      }
      n++;
    }
    return n;
  }

  private normalizeRow(row: any): any {
    const out: any = {};
    for (const [k, v] of Object.entries(row ?? {})) {
      if (typeof v === 'string' && /At$/.test(k)) {
        // ISO date strings → Date objects
        const d = new Date(v);
        out[k] = Number.isNaN(d.getTime()) ? v : d;
      } else {
        out[k] = v;
      }
    }
    return out;
  }
}
