import { AssetTypeFullResponseDto } from '../../dto/responses/index.js';
import type { AssetType } from '../../../domain/entities/index.js';

export function mapAssetTypeToResponse(
  assetType: AssetType,
): AssetTypeFullResponseDto {
  const dto = new AssetTypeFullResponseDto();
  dto.id = assetType.id;
  dto.code = assetType.code;
  dto.label = assetType.label;
  dto.group = assetType.group;
  return dto;
}
