import { api } from './client';
import type { PortfolioSnapshot } from '../types';

export interface CurrentPortfolioValue {
  value: string;
  currency: string;
}

export interface CreatePortfolioSnapshotDto {
  value?: string;
  currency?: string;
  notes?: string;
  observedAt?: string;
}

export async function getPortfolioSnapshots(): Promise<PortfolioSnapshot[]> {
  const res = await api.get('/portfolio-snapshots');
  return res.data;
}

export async function getCurrentPortfolioValue(): Promise<CurrentPortfolioValue> {
  const res = await api.get('/portfolio-snapshots/current-value');
  return res.data;
}

export async function createPortfolioSnapshot(dto?: CreatePortfolioSnapshotDto): Promise<PortfolioSnapshot> {
  const res = await api.post('/portfolio-snapshots', dto ?? {});
  return res.data;
}

export async function deletePortfolioSnapshot(id: string): Promise<void> {
  await api.delete(`/portfolio-snapshots/${id}`);
}
