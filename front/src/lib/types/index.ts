export interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  quantity: string | null;
  disposed: boolean;
  portfolioId: string;
  portfolio?: Portfolio;
  assetType: AssetType;
  categories: Category[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
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
  portfolioId: string;
  value: string;
  observedAt: string;
  createdAt: string;
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

// Request types
export interface CreatePortfolioRequest {
  name: string;
  baseCurrency: string;
}

export interface UpdatePortfolioRequest {
  name?: string;
  baseCurrency?: string;
}

export interface CreateAssetRequest {
  name: string;
  portfolioId: string;
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
