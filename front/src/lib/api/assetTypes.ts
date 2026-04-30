import { api } from './client';
import type { AssetType } from '../types';

export const assetTypeApi = {
  getAll: () => api.get<AssetType[]>('/asset-types').then((r) => r.data),
  getById: (id: string) =>
    api.get<AssetType>(`/asset-types/${id}`).then((r) => r.data),
};
