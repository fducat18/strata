import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagApi } from '../api';
import { queryKeys } from './queryKeys';
import { invalidateTagQueries } from './invalidation';
import type { CreateTagRequest } from '../types';

export function useTags() {
  return useQuery({ queryKey: queryKeys.tags, queryFn: tagApi.getAll });
}

export function useTag(id: string) {
  return useQuery({
    queryKey: queryKeys.tag(id),
    queryFn: () => tagApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTagRequest) => tagApi.create(data),
    onSuccess: () => invalidateTagQueries(qc),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      tagApi.update(id, name),
    onSuccess: () => invalidateTagQueries(qc),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagApi.delete(id),
    onSuccess: () => invalidateTagQueries(qc),
  });
}
