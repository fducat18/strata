import { api } from './client';
import type { FinancingScenario, SaveFinancingScenarioRequest } from '../types';

export const financingScenarioApi = {
  getAll: () => api.get<FinancingScenario[]>('/financing-scenarios').then((r) => r.data),
  getById: (id: string) => api.get<FinancingScenario>(`/financing-scenarios/${id}`).then((r) => r.data),
  create: (data: SaveFinancingScenarioRequest) =>
    api.post<FinancingScenario>('/financing-scenarios', data).then((r) => r.data),
  update: (id: string, data: SaveFinancingScenarioRequest) =>
    api.put<FinancingScenario>(`/financing-scenarios/${id}`, data).then((r) => r.data),
  recalculate: (id: string) =>
    api.post<FinancingScenario>(`/financing-scenarios/${id}/recalculate`).then((r) => r.data),
  delete: (id: string) => api.delete(`/financing-scenarios/${id}`).then((r) => r.data),
};
