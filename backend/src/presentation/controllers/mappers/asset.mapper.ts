import {
  AssetResponseDto,
  AssetSnapshotResponseDto,
} from '../../dto/responses/index.js';
import type { Asset, AssetSnapshot } from '../../../domain/entities/index.js';

export function mapAssetToResponse(asset: Asset): AssetResponseDto {
  const dto = new AssetResponseDto();
  dto.id = asset.id;
  dto.name = asset.name;
  dto.quantity = asset.quantity ? asset.quantity.toString() : null;
  dto.disposed = asset.disposed;
  dto.assetTypeId = asset.assetTypeId;
  dto.createdAt = asset.createdAt.toISOString();
  dto.updatedAt = asset.updatedAt.toISOString();
  dto.assetType = asset.assetType
    ? {
        id: asset.assetType.id,
        code: asset.assetType.code,
        label: asset.assetType.label,
        group: asset.assetType.group,
      }
    : null;
  dto.categories = (asset.categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
  }));
  dto.tags = (asset.tags ?? []).map((t) => ({ id: t.id, name: t.name }));
  dto.currentValue = asset.currentValue()?.toString() ?? null;
  dto.snapshots = (asset.snapshots ?? []).map((s) => ({
    id: s.id,
    value: s.value.toString(),
    observedAt: s.observedAt.toISOString(),
  }));
  const acquireTx = (asset.transactions ?? []).find((t) => t.type === 'ACQUIRE');
  dto.acquisitionDate = acquireTx ? acquireTx.occurredAt.toISOString() : null;
  return dto;
}

export function mapAssetSnapshotToResponse(
  snapshot: AssetSnapshot,
): AssetSnapshotResponseDto {
  const dto = new AssetSnapshotResponseDto();
  dto.id = snapshot.id;
  dto.assetId = snapshot.assetId;
  dto.value = snapshot.value.toString();
  dto.observedAt = snapshot.observedAt.toISOString();
  dto.createdAt = snapshot.createdAt.toISOString();
  return dto;
}
