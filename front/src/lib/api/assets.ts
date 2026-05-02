import { api } from './client';
import type {
  Asset,
  AssetSnapshot,
  CreateAssetRequest,
  UpdateAssetRequest,
  CreateSnapshotRequest,
  UpdateSnapshotRequest,
  DisposeAssetRequest,
} from '../types';

export const assetApi = {
  getAll: () => {
    return api.get<Asset[]>('/assets').then((r) => r.data);
  },
  getById: (id: string) => api.get<Asset>(`/assets/${id}`).then((r) => r.data),
  create: (data: CreateAssetRequest) =>
    api.post<Asset>('/assets', data).then((r) => r.data),
  update: (id: string, data: UpdateAssetRequest) =>
    api.put<Asset>(`/assets/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/assets/${id}`).then((r) => r.data),
  dispose: (id: string, data: DisposeAssetRequest) =>
    api.patch<Asset>(`/assets/${id}/dispose`, data).then((r) => r.data),
  getSnapshots: (id: string) =>
    api.get<AssetSnapshot[]>(`/assets/${id}/snapshots`).then((r) => r.data),
  createSnapshot: (id: string, data: CreateSnapshotRequest) =>
    api.post<AssetSnapshot>(`/assets/${id}/snapshots`, data).then((r) => r.data),
  updateSnapshot: (assetId: string, snapshotId: string, data: UpdateSnapshotRequest) =>
    api.put<AssetSnapshot>(`/assets/${assetId}/snapshots/${snapshotId}`, data).then((r) => r.data),
  addTag: (id: string, tagId: string) =>
    api.post(`/assets/${id}/tags/${tagId}`).then((r) => r.data),
  removeTag: (id: string, tagId: string) =>
    api.delete(`/assets/${id}/tags/${tagId}`).then((r) => r.data),
  addCategory: (id: string, categoryId: string) =>
    api.post(`/assets/${id}/categories/${categoryId}`).then((r) => r.data),
  removeCategory: (id: string, categoryId: string) =>
    api.delete(`/assets/${id}/categories/${categoryId}`).then((r) => r.data),
};
