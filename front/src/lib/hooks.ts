import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi, assetApi, categoryApi, tagApi, assetTypeApi } from './api-client';
import type {
  CreatePortfolioRequest, UpdatePortfolioRequest,
  CreateAssetRequest, UpdateAssetRequest,
  CreateSnapshotRequest, CreateCategoryRequest, CreateTagRequest,
} from './types';

// Query keys
export const queryKeys = {
  portfolios: ['portfolios'] as const,
  portfolio: (id: string) => ['portfolios', id] as const,
  portfolioSnapshots: (id: string) => ['portfolios', id, 'snapshots'] as const,
  assets: (portfolioId?: string) => ['assets', { portfolioId }] as const,
  asset: (id: string) => ['assets', id] as const,
  assetSnapshots: (id: string) => ['assets', id, 'snapshots'] as const,
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  categoryChildren: (id: string) => ['categories', id, 'children'] as const,
  tags: ['tags'] as const,
  tag: (id: string) => ['tags', id] as const,
  assetTypes: ['asset-types'] as const,
};

// Portfolio hooks
export function usePortfolios() {
  return useQuery({ queryKey: queryKeys.portfolios, queryFn: portfolioApi.getAll });
}

export function usePortfolio(id: string) {
  return useQuery({ queryKey: queryKeys.portfolio(id), queryFn: () => portfolioApi.getById(id), enabled: !!id });
}

export function usePortfolioSnapshots(id: string) {
  return useQuery({ queryKey: queryKeys.portfolioSnapshots(id), queryFn: () => portfolioApi.getSnapshots(id), enabled: !!id });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePortfolioRequest) => portfolioApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.portfolios }); },
  });
}

export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePortfolioRequest }) => portfolioApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.portfolios });
      qc.invalidateQueries({ queryKey: queryKeys.portfolio(id) });
    },
  });
}

export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => portfolioApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.portfolios }); },
  });
}

export function useTakePortfolioSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => portfolioApi.takeSnapshot(id),
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: queryKeys.portfolioSnapshots(id) }); },
  });
}

// Asset hooks
export function useAssets(portfolioId?: string) {
  return useQuery({ queryKey: queryKeys.assets(portfolioId), queryFn: () => assetApi.getAll(portfolioId) });
}

export function useAsset(id: string) {
  return useQuery({ queryKey: queryKeys.asset(id), queryFn: () => assetApi.getById(id), enabled: !!id });
}

export function useAssetSnapshots(id: string) {
  return useQuery({ queryKey: queryKeys.assetSnapshots(id), queryFn: () => assetApi.getSnapshots(id), enabled: !!id });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetRequest) => assetApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); },
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetRequest }) => assetApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: queryKeys.asset(id) });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); },
  });
}

export function useDisposeAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetApi.dispose(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: queryKeys.asset(id) });
    },
  });
}

export function useCreateAssetSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateSnapshotRequest }) => assetApi.createSnapshot(id, data),
    onSuccess: (_, { id }) => { qc.invalidateQueries({ queryKey: queryKeys.assetSnapshots(id) }); },
  });
}

export function useAddTagToAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, tagId }: { assetId: string; tagId: string }) => assetApi.addTag(assetId, tagId),
    onSuccess: (_, { assetId }) => { qc.invalidateQueries({ queryKey: queryKeys.asset(assetId) }); },
  });
}

export function useRemoveTagFromAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, tagId }: { assetId: string; tagId: string }) => assetApi.removeTag(assetId, tagId),
    onSuccess: (_, { assetId }) => { qc.invalidateQueries({ queryKey: queryKeys.asset(assetId) }); },
  });
}

export function useAddCategoryToAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, categoryId }: { assetId: string; categoryId: string }) => assetApi.addCategory(assetId, categoryId),
    onSuccess: (_, { assetId }) => { qc.invalidateQueries({ queryKey: queryKeys.asset(assetId) }); },
  });
}

export function useRemoveCategoryFromAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, categoryId }: { assetId: string; categoryId: string }) => assetApi.removeCategory(assetId, categoryId),
    onSuccess: (_, { assetId }) => { qc.invalidateQueries({ queryKey: queryKeys.asset(assetId) }); },
  });
}

// Category hooks
export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: categoryApi.getAll });
}

export function useCategory(id: string) {
  return useQuery({ queryKey: queryKeys.category(id), queryFn: () => categoryApi.getById(id), enabled: !!id });
}

export function useCategoryChildren(id: string) {
  return useQuery({ queryKey: queryKeys.categoryChildren(id), queryFn: () => categoryApi.getChildren(id), enabled: !!id });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoryApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.categories }); },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.categories }); },
  });
}

// Tag hooks
export function useTags() {
  return useQuery({ queryKey: queryKeys.tags, queryFn: tagApi.getAll });
}

export function useTag(id: string) {
  return useQuery({ queryKey: queryKeys.tag(id), queryFn: () => tagApi.getById(id), enabled: !!id });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTagRequest) => tagApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.tags }); },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.tags }); },
  });
}

// Asset Type hooks
export function useAssetTypes() {
  return useQuery({ queryKey: queryKeys.assetTypes, queryFn: assetTypeApi.getAll });
}
