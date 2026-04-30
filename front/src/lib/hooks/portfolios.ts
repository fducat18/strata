import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi } from '../api';
import { queryKeys } from './queryKeys';
import { invalidatePortfolioQueries } from './invalidation';
import type {
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
} from '../types';

export function usePortfolios() {
  return useQuery({ queryKey: queryKeys.portfolios, queryFn: portfolioApi.getAll });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: queryKeys.portfolio(id),
    queryFn: () => portfolioApi.getById(id),
    enabled: !!id,
  });
}

export function usePortfolioSnapshots(id: string) {
  return useQuery({
    queryKey: queryKeys.portfolioSnapshots(id),
    queryFn: () => portfolioApi.getSnapshots(id),
    enabled: !!id,
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePortfolioRequest) => portfolioApi.create(data),
    onSuccess: () => invalidatePortfolioQueries(qc),
  });
}

export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePortfolioRequest }) =>
      portfolioApi.update(id, data),
    onSuccess: (_, { id }) => invalidatePortfolioQueries(qc, id),
  });
}

export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => portfolioApi.delete(id),
    onSuccess: () => invalidatePortfolioQueries(qc),
  });
}

export function useTakePortfolioSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => portfolioApi.takeSnapshot(id),
    onSuccess: (_, id) => invalidatePortfolioQueries(qc, id),
  });
}
