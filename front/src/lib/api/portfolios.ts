import { api } from './client';
import type {
  Portfolio,
  PortfolioSnapshot,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
} from '../types';

export const portfolioApi = {
  getAll: () => api.get<Portfolio[]>('/portfolios').then((r) => r.data),
  getById: (id: string) =>
    api.get<Portfolio>(`/portfolios/${id}`).then((r) => r.data),
  create: (data: CreatePortfolioRequest) =>
    api.post<Portfolio>('/portfolios', data).then((r) => r.data),
  update: (id: string, data: UpdatePortfolioRequest) =>
    api.put<Portfolio>(`/portfolios/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/portfolios/${id}`).then((r) => r.data),
  takeSnapshot: (id: string) =>
    api.post<PortfolioSnapshot>(`/portfolios/${id}/snapshots`).then((r) => r.data),
  getSnapshots: (id: string) =>
    api.get<PortfolioSnapshot[]>(`/portfolios/${id}/snapshots`).then((r) => r.data),
};
