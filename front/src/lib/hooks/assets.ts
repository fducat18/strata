import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetApi } from '../api';
import { queryKeys } from './queryKeys';
import { invalidateAssetQueries } from './invalidation';
import type {
  CreateAssetRequest,
  UpdateAssetRequest,
  CreateSnapshotRequest,
  UpdateSnapshotRequest,
  DisposeAssetRequest,
} from '../types';

export function useAssets() {
  return useQuery({
    queryKey: queryKeys.assets(),
    queryFn: () => assetApi.getAll(),
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: queryKeys.asset(id),
    queryFn: () => assetApi.getById(id),
    enabled: !!id,
  });
}

export function useAssetSnapshots(id: string) {
  return useQuery({
    queryKey: queryKeys.assetSnapshots(id),
    queryFn: () => assetApi.getSnapshots(id),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetRequest) => assetApi.create(data),
    onSuccess: () => invalidateAssetQueries(qc),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetRequest }) =>
      assetApi.update(id, data),
    onSuccess: (_, { id }) => invalidateAssetQueries(qc, id),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetApi.delete(id),
    onSuccess: () => invalidateAssetQueries(qc),
  });
}

export function useDisposeAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DisposeAssetRequest }) =>
      assetApi.dispose(id, data),
    onSuccess: (_, { id }) => invalidateAssetQueries(qc, id),
  });
}

export function useCreateAssetSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateSnapshotRequest }) =>
      assetApi.createSnapshot(id, data),
    onSuccess: (_, { id }) => invalidateAssetQueries(qc, id),
  });
}

export function useUpdateAssetSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, snapshotId, data }: { assetId: string; snapshotId: string; data: UpdateSnapshotRequest }) =>
      assetApi.updateSnapshot(assetId, snapshotId, data),
    onSuccess: (_, { assetId }) => invalidateAssetQueries(qc, assetId),
  });
}

export function useDeleteAssetSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, snapshotId }: { assetId: string; snapshotId: string }) =>
      assetApi.deleteSnapshot(assetId, snapshotId),
    onSuccess: (_, { assetId }) => invalidateAssetQueries(qc, assetId),
  });
}

export function useAddTagToAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, tagId }: { assetId: string; tagId: string }) =>
      assetApi.addTag(assetId, tagId),
    onSuccess: (_, { assetId }) => invalidateAssetQueries(qc, assetId),
  });
}

export function useRemoveTagFromAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, tagId }: { assetId: string; tagId: string }) =>
      assetApi.removeTag(assetId, tagId),
    onSuccess: (_, { assetId }) => invalidateAssetQueries(qc, assetId),
  });
}

export function useAddCategoryToAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, categoryId }: { assetId: string; categoryId: string }) =>
      assetApi.addCategory(assetId, categoryId),
    onSuccess: (_, { assetId }) => invalidateAssetQueries(qc, assetId),
  });
}

export function useRemoveCategoryFromAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, categoryId }: { assetId: string; categoryId: string }) =>
      assetApi.removeCategory(assetId, categoryId),
    onSuccess: (_, { assetId }) => invalidateAssetQueries(qc, assetId),
  });
}
