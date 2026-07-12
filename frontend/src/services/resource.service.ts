import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type { ApiResponse, Resource } from '@/types';

export const resourceService = {
  async list(): Promise<Resource[]> {
    try {
      const { data } = await api.get<ApiResponse<{ resources: Resource[] }>>(API_ENDPOINTS.resources.list);
      return (data.data as { resources: Resource[] }).resources;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getOne(id: string): Promise<Resource> {
    try {
      const { data } = await api.get<ApiResponse<{ resource: Resource }>>(API_ENDPOINTS.resources.get(id));
      return (data.data as { resource: Resource }).resource;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
