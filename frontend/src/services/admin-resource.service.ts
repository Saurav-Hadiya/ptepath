import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type { ApiResponse, AdminResource } from '@/types';

export interface AdminResourceCreateInput {
  title: string;
  description: string;
  file: File;
}

export interface AdminResourceUpdateInput {
  title?: string;
  description?: string;
}

export const adminResourceService = {
  async list(): Promise<AdminResource[]> {
    try {
      const { data } = await api.get<ApiResponse<{ resources: AdminResource[] }>>(
        API_ENDPOINTS.admin.resources.list
      );
      return (data.data as { resources: AdminResource[] }).resources;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getOne(id: string): Promise<AdminResource> {
    try {
      const { data } = await api.get<ApiResponse<{ resource: AdminResource }>>(
        API_ENDPOINTS.admin.resources.get(id)
      );
      return (data.data as { resource: AdminResource }).resource;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async create(input: AdminResourceCreateInput): Promise<AdminResource> {
    try {
      const formData = new FormData();
      formData.append('title', input.title);
      formData.append('description', input.description);
      formData.append('file', input.file);
      const { data } = await api.post<ApiResponse<{ resource: AdminResource }>>(
        API_ENDPOINTS.admin.resources.create,
        formData
      );
      return (data.data as { resource: AdminResource }).resource;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async update(id: string, input: AdminResourceUpdateInput): Promise<AdminResource> {
    try {
      const { data } = await api.put<ApiResponse<{ resource: AdminResource }>>(
        API_ENDPOINTS.admin.resources.update(id),
        input
      );
      return (data.data as { resource: AdminResource }).resource;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.admin.resources.delete(id));
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async toggleStatus(id: string, isActive: boolean): Promise<AdminResource> {
    try {
      const { data } = await api.patch<ApiResponse<{ resource: AdminResource }>>(
        API_ENDPOINTS.admin.resources.status(id),
        { isActive }
      );
      return (data.data as { resource: AdminResource }).resource;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
