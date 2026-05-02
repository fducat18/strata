import { AssetSnapshot } from '../entities/asset-snapshot.entity';

export interface CreateAssetSnapshotData {
  assetId: string;
  value: string;
  observedAt: Date;
}

export abstract class IAssetSnapshotRepository {
  abstract save(data: CreateAssetSnapshotData): Promise<AssetSnapshot>;
  abstract findByAsset(assetId: string): Promise<AssetSnapshot[]>;
  abstract findLatestByAsset(assetId: string): Promise<AssetSnapshot | null>;
  /** Returns the single latest snapshot for each non-disposed asset. */
  abstract findLatestPerNonDisposedAsset(): Promise<AssetSnapshot[]>;
}
