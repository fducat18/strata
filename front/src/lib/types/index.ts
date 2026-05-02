export interface Asset {
  id: string;
  name: string;
  quantity: string | null;
  disposed: boolean;
  assetTypeId: string;
  assetType: AssetType;
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  snapshots: AssetSnapshot[];
  createdAt: string;
  updatedAt: string;
  currentValue: string | null;
  acquisitionDate?: string | null;
}

export interface AssetType {
  id: string;
  code: string;
  label: string;
  group: string;
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

export interface Transaction {
  id: string;
  assetId: string;
  type: 'ACQUIRE' | 'DISPOSE' | 'ADJUST';
  unitPrice: string;
  quantity: string;
  currency: string;
  occurredAt: string;
  createdAt: string;
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
  acquisitionDate: string;
  acquisitionPrice: string;
}

export interface UpdateAssetRequest {
  name?: string;
  quantity?: string;
  assetTypeId?: string;
  categoryIds?: string[];
  tagIds?: string[];
  acquisitionDate?: string;
}

export interface CreateSnapshotRequest {
  value: string;
  observedAt: string;
}

export interface UpdateSnapshotRequest {
  value?: string;
  observedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  parentId?: string;
}

export interface CreateTagRequest {
  name: string;
}

export interface CreateAssetTypeRequest {
  code: string;
  label: string;
  group: string;
}

export interface UpdateAssetTypeRequest {
  label: string;
  group: string;
}

export interface DisposeAssetRequest {
  disposalDate: string;
  disposalPrice: string;
}
