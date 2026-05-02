import { Asset } from '../entities/asset.entity';

export interface CreateAssetData {
  name: string;
  assetTypeId: string;
  quantity?: string;
  acquisitionDate: string;
  acquisitionPrice: string;
}

export interface UpdateAssetData {
  name?: string;
  quantity?: string;
  assetTypeId?: string;
  disposed?: boolean;
}

export abstract class IAssetRepository {
  abstract save(data: CreateAssetData): Promise<Asset>;
  abstract findById(id: string): Promise<Asset | null>;
  abstract findAll(): Promise<Asset[]>;
  abstract update(id: string, data: UpdateAssetData): Promise<Asset>;
  abstract delete(id: string): Promise<void>;
  abstract dispose(id: string): Promise<Asset>;
  abstract addCategory(assetId: string, categoryId: string): Promise<Asset>;
  abstract removeCategory(assetId: string, categoryId: string): Promise<void>;
  abstract addTag(assetId: string, tagId: string): Promise<Asset>;
  abstract removeTag(assetId: string, tagId: string): Promise<void>;
}
