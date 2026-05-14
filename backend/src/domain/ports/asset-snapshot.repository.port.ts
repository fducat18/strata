import { AssetSnapshot } from '../entities/asset-snapshot.entity';
import { Decimal } from 'decimal.js';

export interface CreateAssetSnapshotData {
  assetId: string;
  value: string;
  observedAt: Date;
}

export interface AssetSnapshotWithGroup {
  value: Decimal;
  group: string;
}

export interface UpdateAssetSnapshotData {
  value?: string;
  observedAt?: Date;
}

export abstract class IAssetSnapshotRepository {
  abstract save(data: CreateAssetSnapshotData): Promise<AssetSnapshot>;
  abstract findByAsset(assetId: string): Promise<AssetSnapshot[]>;
  abstract findLatestByAsset(assetId: string): Promise<AssetSnapshot | null>;
  /** Returns the single latest snapshot for each non-disposed asset. */
  abstract findLatestPerNonDisposedAsset(): Promise<AssetSnapshot[]>;
  /**
   * For each non-disposed asset, returns the latest snapshot with observedAt <= beforeDate.
   * Used by recalculateFromDate to compute portfolio totals for a specific date.
   */
  abstract findLatestPerNonDisposedAssetAsOf(beforeDate: Date): Promise<AssetSnapshot[]>;
  abstract findEarliestByAsset(assetId: string): Promise<AssetSnapshot | null>;
  abstract updateObservedAt(id: string, observedAt: Date): Promise<AssetSnapshot>;
  /** Returns latest snapshot per non-disposed asset, with the asset's group. */
  abstract findLatestPerNonDisposedAssetWithGroup(): Promise<AssetSnapshotWithGroup[]>;
  /** Like above but only snapshots with observedAt <= beforeDate. */
  abstract findLatestPerNonDisposedAssetAsOfWithGroup(beforeDate: Date): Promise<AssetSnapshotWithGroup[]>;
  /** Returns snapshot for the same asset on the same calendar day, or null. */
  abstract findByAssetAndDate(assetId: string, date: Date): Promise<AssetSnapshot | null>;
  /** Find a snapshot by its ID. */
  abstract findById(id: string): Promise<AssetSnapshot | null>;
  /** Update value and/or observedAt of a snapshot. */
  abstract update(id: string, data: UpdateAssetSnapshotData): Promise<AssetSnapshot>;
  /** Delete a snapshot by its ID. */
  abstract delete(id: string): Promise<void>;
}
