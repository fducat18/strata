import { Injectable } from '@nestjs/common';
import { AssetSnapshot as AssetSnapshotModel } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IAssetSnapshotRepository,
  CreateAssetSnapshotData,
  UpdateAssetSnapshotData,
  AssetSnapshotWithGroup,
} from '../../domain/ports/asset-snapshot.repository.port.js';
import { AssetSnapshot } from '../../domain/entities/asset-snapshot.entity.js';

@Injectable()
export class PrismaAssetSnapshotRepository extends IAssetSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private mapToEntity(data: AssetSnapshotModel): AssetSnapshot {
    return new AssetSnapshot(
      data.id,
      data.assetId,
      new Decimal(data.value.toString()),
      data.observedAt,
      data.createdAt,
    );
  }

  async save(data: CreateAssetSnapshotData): Promise<AssetSnapshot> {
    const result = await this.prisma.assetSnapshot.create({
      data: {
        assetId: data.assetId,
        value: new Decimal(data.value),
        observedAt: data.observedAt,
      },
    });
    return this.mapToEntity(result);
  }

  async findByAsset(assetId: string): Promise<AssetSnapshot[]> {
    const results = await this.prisma.assetSnapshot.findMany({
      where: { assetId },
      orderBy: { observedAt: 'desc' },
    });
    return results.map((r) => this.mapToEntity(r));
  }

  async findLatestByAsset(assetId: string): Promise<AssetSnapshot | null> {
    const result = await this.prisma.assetSnapshot.findFirst({
      where: { assetId },
      orderBy: { observedAt: 'desc' },
    });
    return result ? this.mapToEntity(result) : null;
  }

  /**
   * Returns the single latest snapshot per non-disposed asset.
   * Uses distinct + orderBy to get one snapshot per assetId efficiently.
   */
  async findLatestPerNonDisposedAsset(): Promise<AssetSnapshot[]> {
    const results = await this.prisma.assetSnapshot.findMany({
      where: { asset: { disposed: false } },
      orderBy: { observedAt: 'desc' },
      distinct: ['assetId'],
    });
    return results.map((r) => this.mapToEntity(r));
  }

  async findLatestPerNonDisposedAssetAsOf(beforeDate: Date): Promise<AssetSnapshot[]> {
    const results = await this.prisma.assetSnapshot.findMany({
      where: {
        asset: { disposed: false },
        observedAt: { lte: beforeDate },
      },
      orderBy: { observedAt: 'desc' },
      distinct: ['assetId'],
    });
    return results.map((r) => this.mapToEntity(r));
  }

  async findEarliestByAsset(assetId: string): Promise<AssetSnapshot | null> {
    const result = await this.prisma.assetSnapshot.findFirst({
      where: { assetId },
      orderBy: { observedAt: 'asc' },
    });
    return result ? this.mapToEntity(result) : null;
  }

  async updateObservedAt(id: string, observedAt: Date): Promise<AssetSnapshot> {
    const result = await this.prisma.assetSnapshot.update({
      where: { id },
      data: { observedAt },
    });
    return this.mapToEntity(result);
  }

  async findLatestPerNonDisposedAssetWithGroup(): Promise<AssetSnapshotWithGroup[]> {
    const results = await this.prisma.assetSnapshot.findMany({
      where: { asset: { disposed: false } },
      orderBy: { observedAt: 'desc' },
      distinct: ['assetId'],
      include: { asset: { include: { assetType: true } } },
    });
    return results.map((r) => ({
      value: new Decimal(r.value.toString()),
      group: (r.asset as any).assetType?.group ?? 'OTHER',
    }));
  }

  async findLatestPerNonDisposedAssetAsOfWithGroup(beforeDate: Date): Promise<AssetSnapshotWithGroup[]> {
    const results = await this.prisma.assetSnapshot.findMany({
      where: {
        asset: { disposed: false },
        observedAt: { lte: beforeDate },
      },
      orderBy: { observedAt: 'desc' },
      distinct: ['assetId'],
      include: { asset: { include: { assetType: true } } },
    });
    return results.map((r) => ({
      value: new Decimal(r.value.toString()),
      group: (r.asset as any).assetType?.group ?? 'OTHER',
    }));
  }

  async findByAssetAndDate(assetId: string, date: Date): Promise<AssetSnapshot | null> {
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
    const result = await this.prisma.assetSnapshot.findFirst({
      where: {
        assetId,
        observedAt: { gte: dayStart, lt: dayEnd },
      },
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findById(id: string): Promise<AssetSnapshot | null> {
    const result = await this.prisma.assetSnapshot.findUnique({ where: { id } });
    return result ? this.mapToEntity(result) : null;
  }

  async update(id: string, data: UpdateAssetSnapshotData): Promise<AssetSnapshot> {
    const updateData: Record<string, unknown> = {};
    if (data.value !== undefined) updateData['value'] = new Decimal(data.value);
    if (data.observedAt !== undefined) updateData['observedAt'] = data.observedAt;
    const result = await this.prisma.assetSnapshot.update({
      where: { id },
      data: updateData,
    });
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetSnapshot.delete({ where: { id } });
  }
}
