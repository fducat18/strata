import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financingScenarioApi } from '../api';
import type { SaveFinancingScenarioRequest } from '../types';
import { invalidateFinancingScenarioQueries } from './invalidation';
import { queryKeys } from './queryKeys';

export function useFinancingScenarios() {
  return useQuery({
    queryKey: queryKeys.financingScenarios,
    queryFn: () => financingScenarioApi.getAll(),
  });
}

export function useCreateFinancingScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveFinancingScenarioRequest) => financingScenarioApi.create(data),
    onSuccess: () => invalidateFinancingScenarioQueries(queryClient),
  });
}

export function useUpdateFinancingScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaveFinancingScenarioRequest }) =>
      financingScenarioApi.update(id, data),
    onSuccess: () => invalidateFinancingScenarioQueries(queryClient),
  });
}

export function useRecalculateFinancingScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financingScenarioApi.recalculate(id),
    onSuccess: () => invalidateFinancingScenarioQueries(queryClient),
  });
}

export function useDeleteFinancingScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financingScenarioApi.delete(id),
    onSuccess: () => invalidateFinancingScenarioQueries(queryClient),
  });
}
