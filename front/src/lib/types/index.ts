export interface Asset {
  id: string;
  name: string;
  quantity: string | null;
  disposed: boolean;
  assetType: AssetType;
  categories: Category[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  currentValue: string | null;
}

export interface AssetType {
  id: string;
  code: string;
  label: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
}

export interface Tag {
  id: string;
  name: string;
}

export interface AssetSnapshot {
  id: string;
  assetId: string;
  value: string;
  observedAt: string;
  createdAt: string;
}

export interface PortfolioSnapshot {
  id: string;
  value: string;
  currency: string;
  notes?: string;
  observedAt: string;
  createdAt: string;
}

// Request types
export interface CreateAssetRequest {
  name: string;
  assetTypeId: string;
  quantity?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface UpdateAssetRequest {
  name?: string;
  quantity?: string;
  assetTypeId?: string;
}

export interface CreateSnapshotRequest {
  value: string;
  observedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  parentId?: string;
}

export interface CreateTagRequest {
  name: string;
}
