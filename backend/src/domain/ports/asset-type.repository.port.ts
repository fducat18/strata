import { AssetType } from '../entities/asset-type.entity';

export abstract class IAssetTypeRepository {
  abstract findById(id: string): Promise<AssetType | null>;
  abstract findAll(): Promise<AssetType[]>;
  abstract findByCode(code: string): Promise<AssetType | null>;
}
