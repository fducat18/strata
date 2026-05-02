import { Injectable } from '@nestjs/common';
import { AssetSnapshot } from '../../domain/entities/index.js';
import {
  IAssetSnapshotRepository,
  IAssetRepository,
  type CreateAssetSnapshotData,
} from '../../domain/ports/index.js';
import { AssetNotFoundException } from '../../domain/exceptions/index.js';
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

    const snapshot = await this.assetSnapshotRepository.save(data);
    await this.portfolioSnapshotService.recalculateFromDate(snapshot.observedAt);
    return snapshot;
  }

  async findByAsset(assetId: string): Promise<AssetSnapshot[]> {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) throw new AssetNotFoundException(`Asset ${assetId} not found`);

    return this.assetSnapshotRepository.findByAsset(assetId);
  }
}
