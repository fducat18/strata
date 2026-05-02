import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetTypeApi } from '../api';
import { queryKeys } from './queryKeys';
import { invalidateAssetTypeQueries } from './invalidation';
import type { CreateAssetTypeRequest, UpdateAssetTypeRequest } from '../types';

export function useAssetTypes() {
  return useQuery({ queryKey: queryKeys.assetTypes, queryFn: assetTypeApi.getAll });
}

export function useCreateAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetTypeRequest) => assetTypeApi.create(data),
    onSuccess: () => invalidateAssetTypeQueries(qc),
  });
}

export function useUpdateAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateAssetTypeRequest) =>
      assetTypeApi.update(id, data),
    onSuccess: () => invalidateAssetTypeQueries(qc),
  });
}

export function useDeleteAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetTypeApi.delete(id),
    onSuccess: () => invalidateAssetTypeQueries(qc),
  });
}
