import axios from 'axios';
import type {
  Portfolio, Asset, AssetType, Category, Tag,
  AssetSnapshot, PortfolioSnapshot,
  CreatePortfolioRequest, UpdatePortfolioRequest,
  CreateAssetRequest, UpdateAssetRequest,
  CreateSnapshotRequest, CreateCategoryRequest, CreateTagRequest,
} from './types';

const api = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Portfolios
export const portfolioApi = {
  getAll: () => api.get<Portfolio[]>('/portfolios').then(r => r.data),
  getById: (id: string) => api.get<Portfolio>(`/portfolios/${id}`).then(r => r.data),
  create: (data: CreatePortfolioRequest) => api.post<Portfolio>('/portfolios', data).then(r => r.data),
  update: (id: string, data: UpdatePortfolioRequest) => api.put<Portfolio>(`/portfolios/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/portfolios/${id}`).then(r => r.data),
  takeSnapshot: (id: string) => api.post<PortfolioSnapshot>(`/portfolios/${id}/snapshots`).then(r => r.data),
  getSnapshots: (id: string) => api.get<PortfolioSnapshot[]>(`/portfolios/${id}/snapshots`).then(r => r.data),
};

// Assets
export const assetApi = {
  getAll: (portfolioId?: string) => {
    const params = portfolioId ? { portfolio_id: portfolioId } : {};
    return api.get<Asset[]>('/assets', { params }).then(r => r.data);
  },
  getById: (id: string) => api.get<Asset>(`/assets/${id}`).then(r => r.data),
  create: (data: CreateAssetRequest) => api.post<Asset>('/assets', data).then(r => r.data),
  update: (id: string, data: UpdateAssetRequest) => api.put<Asset>(`/assets/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/assets/${id}`).then(r => r.data),
  dispose: (id: string) => api.put<Asset>(`/assets/${id}/dispose`).then(r => r.data),
  getSnapshots: (id: string) => api.get<AssetSnapshot[]>(`/assets/${id}/snapshots`).then(r => r.data),
  createSnapshot: (id: string, data: CreateSnapshotRequest) => api.post<AssetSnapshot>(`/assets/${id}/snapshots`, data).then(r => r.data),
  addTag: (id: string, tagId: string) => api.post(`/assets/${id}/tags/${tagId}`).then(r => r.data),
  removeTag: (id: string, tagId: string) => api.delete(`/assets/${id}/tags/${tagId}`).then(r => r.data),
  addCategory: (id: string, categoryId: string) => api.post(`/assets/${id}/categories/${categoryId}`).then(r => r.data),
  removeCategory: (id: string, categoryId: string) => api.delete(`/assets/${id}/categories/${categoryId}`).then(r => r.data),
};

// Categories
export const categoryApi = {
  getAll: () => api.get<Category[]>('/categories').then(r => r.data),
  getById: (id: string) => api.get<Category>(`/categories/${id}`).then(r => r.data),
  create: (data: CreateCategoryRequest) => api.post<Category>('/categories', data).then(r => r.data),
  delete: (id: string) => api.delete(`/categories/${id}`).then(r => r.data),
  getChildren: (id: string) => api.get<Category[]>(`/categories/${id}/children`).then(r => r.data),
};

// Tags
export const tagApi = {
  getAll: () => api.get<Tag[]>('/tags').then(r => r.data),
  getById: (id: string) => api.get<Tag>(`/tags/${id}`).then(r => r.data),
  create: (data: CreateTagRequest) => api.post<Tag>('/tags', data).then(r => r.data),
  delete: (id: string) => api.delete(`/tags/${id}`).then(r => r.data),
};

// Asset Types
export const assetTypeApi = {
  getAll: () => api.get<AssetType[]>('/asset-types').then(r => r.data),
  getById: (id: string) => api.get<AssetType>(`/asset-types/${id}`).then(r => r.data),
};
