import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api';
import { queryKeys } from './queryKeys';
import { invalidateCategoryQueries } from './invalidation';
import type { CreateCategoryRequest } from '../types';

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: categoryApi.getAll });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: queryKeys.category(id),
    queryFn: () => categoryApi.getById(id),
    enabled: !!id,
  });
}

export function useCategoryChildren(id: string) {
  return useQuery({
    queryKey: queryKeys.categoryChildren(id),
    queryFn: () => categoryApi.getChildren(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoryApi.create(data),
    onSuccess: () => invalidateCategoryQueries(qc),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => invalidateCategoryQueries(qc),
  });
}
