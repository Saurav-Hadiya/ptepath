import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type { ApiResponse, AdminWritingQuestion } from '@/types';

export interface AdminWritingQuestionsResponse {
  questions: AdminWritingQuestion[];
  total: number;
}

export interface AdminWritingFormInput {
  type: string;
  content: string;
  timeLimit?: number;
}

export interface AdminWritingUpdateInput {
  content?: string;
  timeLimit?: number;
}

export const adminWritingService = {
  async list(type?: string, search?: string): Promise<AdminWritingQuestionsResponse> {
    try {
      const params: Record<string, string> = {};
      if (type) params.type = type;
      if (search && search.trim() !== '') params.search = search.trim();
      const { data } = await api.get<ApiResponse<AdminWritingQuestionsResponse>>(
        API_ENDPOINTS.admin.writing.list,
        { params }
      );
      return data.data as AdminWritingQuestionsResponse;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getOne(id: string): Promise<AdminWritingQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: AdminWritingQuestion }>>(
        API_ENDPOINTS.admin.writing.get(id)
      );
      return (data.data as { question: AdminWritingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async create(input: AdminWritingFormInput): Promise<AdminWritingQuestion> {
    try {
      const { data } = await api.post<ApiResponse<{ question: AdminWritingQuestion }>>(
        API_ENDPOINTS.admin.writing.create,
        input
      );
      return (data.data as { question: AdminWritingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async update(id: string, input: AdminWritingUpdateInput): Promise<AdminWritingQuestion> {
    try {
      const { data } = await api.put<ApiResponse<{ question: AdminWritingQuestion }>>(
        API_ENDPOINTS.admin.writing.update(id),
        input
      );
      return (data.data as { question: AdminWritingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.admin.writing.delete(id));
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async toggleStatus(id: string, isActive: boolean): Promise<AdminWritingQuestion> {
    try {
      const { data } = await api.patch<ApiResponse<{ question: AdminWritingQuestion }>>(
        API_ENDPOINTS.admin.writing.status(id),
        { isActive }
      );
      return (data.data as { question: AdminWritingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
