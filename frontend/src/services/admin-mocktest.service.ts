import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type { ApiResponse, MockTestTemplate, MockTestQuestionRule } from '@/types';

export interface MockTestTemplatePayload {
  name: string;
  description: string;
  totalTime: number;
  questionRules: MockTestQuestionRule[];
}

export const adminMockTestService = {
  async list(search?: string): Promise<{ templates: MockTestTemplate[]; total: number }> {
    try {
      const { data } = await api.get<ApiResponse<{ templates: MockTestTemplate[]; total: number }>>(
        API_ENDPOINTS.admin.mockTests.list,
        { params: search ? { search } : undefined }
      );
      return data.data as { templates: MockTestTemplate[]; total: number };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async create(payload: MockTestTemplatePayload): Promise<MockTestTemplate> {
    try {
      const { data } = await api.post<ApiResponse<{ template: MockTestTemplate }>>(
        API_ENDPOINTS.admin.mockTests.create,
        payload
      );
      return (data.data as { template: MockTestTemplate }).template;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async update(id: string, payload: Partial<MockTestTemplatePayload>): Promise<MockTestTemplate> {
    try {
      const { data } = await api.put<ApiResponse<{ template: MockTestTemplate }>>(
        API_ENDPOINTS.admin.mockTests.update(id),
        payload
      );
      return (data.data as { template: MockTestTemplate }).template;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async remove(id: string): Promise<{ message?: string }> {
    try {
      const { data } = await api.delete<ApiResponse>(API_ENDPOINTS.admin.mockTests.delete(id));
      return { message: data.message };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async toggleStatus(id: string, isActive: boolean): Promise<MockTestTemplate> {
    try {
      const { data } = await api.patch<ApiResponse<{ template: MockTestTemplate }>>(
        API_ENDPOINTS.admin.mockTests.status(id),
        { isActive }
      );
      return (data.data as { template: MockTestTemplate }).template;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
