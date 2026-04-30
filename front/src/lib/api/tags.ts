import { api } from './client';
import type { Tag, CreateTagRequest } from '../types';

export const tagApi = {
  getAll: () => api.get<Tag[]>('/tags').then((r) => r.data),
  getById: (id: string) => api.get<Tag>(`/tags/${id}`).then((r) => r.data),
  create: (data: CreateTagRequest) =>
    api.post<Tag>('/tags', data).then((r) => r.data),
  delete: (id: string) => api.delete(`/tags/${id}`).then((r) => r.data),
};
