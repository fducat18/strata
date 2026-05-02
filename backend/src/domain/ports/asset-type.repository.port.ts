import { AssetType } from '../entities/asset-type.entity';

export abstract class IAssetTypeRepository {
  abstract findById(id: string): Promise<AssetType | null>;
  abstract findAll(): Promise<AssetType[]>;
}
