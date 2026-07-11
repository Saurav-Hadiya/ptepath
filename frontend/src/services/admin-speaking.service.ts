import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type { ApiResponse, AdminSpeakingQuestion } from '@/types';

export interface AdminSpeakingQuestionsResponse {
  questions: AdminSpeakingQuestion[];
  total: number;
}

export interface AdminSpeakingFormInput {
  type: string;
  content?: string;
  speakingTime: number;
  preparationTime?: number;
  acceptedAnswers?: string[];
  imageFile?: File | null;
}

/** Builds the multipart body used for both create and update calls. */
function buildFormData(input: AdminSpeakingFormInput, includeType: boolean): FormData {
  const formData = new FormData();
  if (includeType) formData.append('type', input.type);
  if (input.content !== undefined) formData.append('content', input.content);
  formData.append('speakingTime', String(input.speakingTime));
  if (input.preparationTime !== undefined) {
    formData.append('preparationTime', String(input.preparationTime));
  }
  if (input.acceptedAnswers !== undefined) {
    formData.append('acceptedAnswers', JSON.stringify(input.acceptedAnswers));
  }
  if (input.imageFile) {
    formData.append('image', input.imageFile);
  }
  return formData;
}

export const adminSpeakingService = {
  async list(type?: string, search?: string): Promise<AdminSpeakingQuestionsResponse> {
    try {
      const params: Record<string, string> = {};
      if (type) params.type = type;
      if (search && search.trim() !== '') params.search = search.trim();
      const { data } = await api.get<ApiResponse<AdminSpeakingQuestionsResponse>>(
        API_ENDPOINTS.admin.speaking.list,
        { params }
      );
      return data.data as AdminSpeakingQuestionsResponse;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getOne(id: string): Promise<AdminSpeakingQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: AdminSpeakingQuestion }>>(
        API_ENDPOINTS.admin.speaking.get(id)
      );
      return (data.data as { question: AdminSpeakingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async create(input: AdminSpeakingFormInput): Promise<AdminSpeakingQuestion> {
    try {
      const { data } = await api.post<ApiResponse<{ question: AdminSpeakingQuestion }>>(
        API_ENDPOINTS.admin.speaking.create,
        buildFormData(input, true)
      );
      return (data.data as { question: AdminSpeakingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async update(id: string, input: AdminSpeakingFormInput): Promise<AdminSpeakingQuestion> {
    try {
      const { data } = await api.put<ApiResponse<{ question: AdminSpeakingQuestion }>>(
        API_ENDPOINTS.admin.speaking.update(id),
        buildFormData(input, false)
      );
      return (data.data as { question: AdminSpeakingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.admin.speaking.delete(id));
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async toggleStatus(id: string, isActive: boolean): Promise<AdminSpeakingQuestion> {
    try {
      const { data } = await api.patch<ApiResponse<{ question: AdminSpeakingQuestion }>>(
        API_ENDPOINTS.admin.speaking.status(id),
        { isActive }
      );
      return (data.data as { question: AdminSpeakingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async updateTypeSettings(
    type: string,
    settings: { speakingTime: number; preparationTime?: number }
  ): Promise<void> {
    try {
      await api.patch(API_ENDPOINTS.admin.speaking.typeSettings(type), settings);
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
