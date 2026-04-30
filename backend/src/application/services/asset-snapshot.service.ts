import { Injectable } from '@nestjs/common';
import { AssetSnapshot } from '../../domain/entities/index.js';
import {
  IAssetSnapshotRepository,
  IAssetRepository,
  type CreateAssetSnapshotData,
} from '../../domain/ports/index.js';
import { AssetNotFoundException } from '../../domain/exceptions/index.js';

@Injectable()
export class AssetSnapshotService {
  constructor(
    private readonly assetSnapshotRepository: IAssetSnapshotRepository,
    private readonly assetRepository: IAssetRepository,
  ) {}

  async create(data: CreateAssetSnapshotData): Promise<AssetSnapshot> {
    const asset = await this.assetRepository.findById(data.assetId);
    if (!asset)
      throw new AssetNotFoundException(`Asset ${data.assetId} not found`);

    return this.assetSnapshotRepository.save(data);
  }

  async findByAsset(assetId: string): Promise<AssetSnapshot[]> {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) throw new AssetNotFoundException(`Asset ${assetId} not found`);

    return this.assetSnapshotRepository.findByAsset(assetId);
  }
}
