import { api } from './client';
import type { AssetType, CreateAssetTypeRequest, UpdateAssetTypeRequest } from '../types';

export const assetTypeApi = {
  getAll: () => api.get<AssetType[]>('/asset-types').then((r) => r.data),
  getById: (id: string) => api.get<AssetType>(`/asset-types/${id}`).then((r) => r.data),
  create: (data: CreateAssetTypeRequest) =>
    api.post<AssetType>('/asset-types', data).then((r) => r.data),
  update: (id: string, data: UpdateAssetTypeRequest) =>
    api.put<AssetType>(`/asset-types/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/asset-types/${id}`).then((r) => r.data),
};
