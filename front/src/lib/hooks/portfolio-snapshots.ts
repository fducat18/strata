import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPortfolioSnapshot,
  deletePortfolioSnapshot,
  getCurrentPortfolioValue,
  getPortfolioSnapshots,
  type CreatePortfolioSnapshotDto,
} from '../api/portfolio-snapshots';
import { queryKeys } from './queryKeys';

export function usePortfolioSnapshots() {
  return useQuery({
    queryKey: queryKeys.portfolioSnapshots.all(),
    queryFn: getPortfolioSnapshots,
  });
}

export function useCurrentPortfolioValue() {
  return useQuery({
    queryKey: queryKeys.portfolioSnapshots.currentValue(),
    queryFn: getCurrentPortfolioValue,
  });
}

export function useCreatePortfolioSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto?: CreatePortfolioSnapshotDto) => createPortfolioSnapshot(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshots.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshots.currentValue() });
    },
  });
}

export function useDeletePortfolioSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePortfolioSnapshot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshots.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshots.currentValue() });
    },
  });
}
