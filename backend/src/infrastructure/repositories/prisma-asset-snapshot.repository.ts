import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IAssetSnapshotRepository,
  CreateAssetSnapshotData,
} from '../../domain/ports/asset-snapshot.repository.port.js';
import { AssetSnapshot } from '../../domain/entities/asset-snapshot.entity.js';

@Injectable()
export class PrismaAssetSnapshotRepository extends IAssetSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private mapToEntity(data: any): AssetSnapshot {
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
}
