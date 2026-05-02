import { api } from './client';
import type { Category, CreateCategoryRequest } from '../types';

export const categoryApi = {
  getAll: () => api.get<Category[]>('/categories').then((r) => r.data),
  getById: (id: string) =>
    api.get<Category>(`/categories/${id}`).then((r) => r.data),
  create: (data: CreateCategoryRequest) =>
    api.post<Category>('/categories', data).then((r) => r.data),
  update: (id: string, name: string) =>
    api.put<Category>(`/categories/${id}`, { name }).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/categories/${id}`).then((r) => r.data),
  getChildren: (id: string) =>
    api.get<Category[]>(`/categories/${id}/children`).then((r) => r.data),
};
