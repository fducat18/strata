import { AssetType } from '../entities/asset-type.entity';

export interface CreateAssetTypeData {
  code: string;
  label: string;
  group: string;
}

export interface UpdateAssetTypeData {
  label: string;
  group: string;
}

export abstract class IAssetTypeRepository {
  abstract findById(id: string): Promise<AssetType | null>;
  abstract findAll(): Promise<AssetType[]>;
  abstract create(data: CreateAssetTypeData): Promise<AssetType>;
  abstract update(id: string, data: UpdateAssetTypeData): Promise<AssetType>;
  abstract delete(id: string): Promise<void>;
  abstract countByTypeId(assetTypeId: string): Promise<number>;
}
