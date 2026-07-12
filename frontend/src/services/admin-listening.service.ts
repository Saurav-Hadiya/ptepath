import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type {
  ApiResponse,
  AdminListeningQuestion,
  AdminListeningOption,
  AdminListeningBlank,
  AdminListeningTypeSettings,
  ListeningQuestionType,
} from '@/types';

export interface AdminListeningFormInput {
  type: ListeningQuestionType;
  question?: string;
  options?: AdminListeningOption[];
  transcript?: string;
  blanks?: AdminListeningBlank[];
  incorrectWordIndices?: number[];
  correctSentence?: string;
  audioFile?: File | null;
}

export interface AdminListeningQuestionsResponse {
  questions: AdminListeningQuestion[];
  total: number;
}

/** Builds the multipart body used for both create and update calls — arrays sent as JSON strings. */
function buildFormData(input: AdminListeningFormInput, includeType: boolean): FormData {
  const formData = new FormData();
  if (includeType) formData.append('type', input.type);
  if (input.question !== undefined) formData.append('question', input.question);
  if (input.options !== undefined) formData.append('options', JSON.stringify(input.options));
  if (input.transcript !== undefined) formData.append('transcript', input.transcript);
  if (input.blanks !== undefined) formData.append('blanks', JSON.stringify(input.blanks));
  if (input.incorrectWordIndices !== undefined) {
    formData.append('incorrectWordIndices', JSON.stringify(input.incorrectWordIndices));
  }
  if (input.correctSentence !== undefined) formData.append('correctSentence', input.correctSentence);
  if (input.audioFile) formData.append('audio', input.audioFile);
  return formData;
}

export const adminListeningService = {
  async list(type?: string, search?: string): Promise<AdminListeningQuestionsResponse> {
    try {
      const params: Record<string, string> = {};
      if (type) params.type = type;
      if (search) params.search = search;
      const { data } = await api.get<ApiResponse<AdminListeningQuestionsResponse>>(
        API_ENDPOINTS.admin.listening.list,
        { params }
      );
      return data.data as AdminListeningQuestionsResponse;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getOne(id: string): Promise<AdminListeningQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: AdminListeningQuestion }>>(
        API_ENDPOINTS.admin.listening.get(id)
      );
      return (data.data as { question: AdminListeningQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async create(input: AdminListeningFormInput): Promise<AdminListeningQuestion> {
    try {
      const { data } = await api.post<ApiResponse<{ question: AdminListeningQuestion }>>(
        API_ENDPOINTS.admin.listening.create,
        buildFormData(input, true)
      );
      return (data.data as { question: AdminListeningQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async update(id: string, input: AdminListeningFormInput): Promise<AdminListeningQuestion> {
    try {
      const { data } = await api.put<ApiResponse<{ question: AdminListeningQuestion }>>(
        API_ENDPOINTS.admin.listening.update(id),
        buildFormData(input, false)
      );
      return (data.data as { question: AdminListeningQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.admin.listening.delete(id));
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async toggleStatus(id: string, isActive: boolean): Promise<AdminListeningQuestion> {
    try {
      const { data } = await api.patch<ApiResponse<{ question: AdminListeningQuestion }>>(
        API_ENDPOINTS.admin.listening.status(id),
        { isActive }
      );
      return (data.data as { question: AdminListeningQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getTypeSettings(type: string): Promise<AdminListeningTypeSettings> {
    try {
      const { data } = await api.get<ApiResponse<{ settings: AdminListeningTypeSettings }>>(
        API_ENDPOINTS.admin.listening.typeSettings(type)
      );
      return (data.data as { settings: AdminListeningTypeSettings }).settings;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async updateTypeSettings(
    type: string,
    settings: { playLimit?: number; timeLimit?: number }
  ): Promise<AdminListeningTypeSettings> {
    try {
      const { data } = await api.patch<ApiResponse<{ settings: AdminListeningTypeSettings }>>(
        API_ENDPOINTS.admin.listening.typeSettings(type),
        settings
      );
      return (data.data as { settings: AdminListeningTypeSettings }).settings;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
