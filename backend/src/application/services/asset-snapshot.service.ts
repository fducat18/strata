import { ConflictException, Injectable } from '@nestjs/common';
import { AssetSnapshot } from '../../domain/entities/index.js';
import {
  IAssetSnapshotRepository,
  IAssetRepository,
  type CreateAssetSnapshotData,
  type UpdateAssetSnapshotData,
} from '../../domain/ports/index.js';
import {
  AssetNotFoundException,
  AssetSnapshotNotFoundException,
} from '../../domain/exceptions/index.js';
import { PortfolioSnapshotService } from './portfolio-snapshot.service.js';

@Injectable()
export class AssetSnapshotService {
  constructor(
    private readonly assetSnapshotRepository: IAssetSnapshotRepository,
    private readonly assetRepository: IAssetRepository,
    private readonly portfolioSnapshotService: PortfolioSnapshotService,
  ) {}

  async create(data: CreateAssetSnapshotData): Promise<AssetSnapshot> {
    const asset = await this.assetRepository.findById(data.assetId);
    if (!asset)
      throw new AssetNotFoundException(`Asset ${data.assetId} not found`);

    const existing = await this.assetSnapshotRepository.findByAssetAndDate(data.assetId, data.observedAt);
    if (existing) {
      throw new ConflictException(
        'A snapshot already exists for this asset on this date. Edit the existing snapshot to change the value.',
      );
    }

    const snapshot = await this.assetSnapshotRepository.save(data);
    await this.portfolioSnapshotService.recalculateFromDate(snapshot.observedAt);
    return snapshot;
  }

  async findByAsset(assetId: string): Promise<AssetSnapshot[]> {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) throw new AssetNotFoundException(`Asset ${assetId} not found`);

    return this.assetSnapshotRepository.findByAsset(assetId);
  }

  async update(id: string, data: UpdateAssetSnapshotData): Promise<AssetSnapshot> {
    const existing = await this.assetSnapshotRepository.findById(id);
    if (!existing) {
      throw new AssetSnapshotNotFoundException(`Snapshot ${id} not found`);
    }
    const snapshot = await this.assetSnapshotRepository.update(id, data);
    const fromDate =
      data.observedAt && data.observedAt < existing.observedAt
        ? data.observedAt
        : existing.observedAt;
    await this.portfolioSnapshotService.recalculateFromDate(fromDate);
    return snapshot;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.assetSnapshotRepository.findById(id);
    if (!existing) {
      throw new AssetSnapshotNotFoundException(`Snapshot ${id} not found`);
    }
    await this.assetSnapshotRepository.delete(id);
    await this.portfolioSnapshotService.recalculateFromDate(existing.observedAt);
  }
}
