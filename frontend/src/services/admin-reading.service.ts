import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type {
  ApiResponse,
  AdminReadingQuestion,
  AdminReadingBlank,
  AdminReadingOption,
  AdminReadingParagraph,
  ReadingQuestionType,
} from '@/types';

export interface AdminReadingFormInput {
  type: ReadingQuestionType;
  passage: string;
  question?: string;
  blanks?: AdminReadingBlank[];
  options?: AdminReadingOption[];
  paragraphs?: AdminReadingParagraph[];
  wordPool?: string[];
}

export interface AdminReadingQuestionsResponse {
  questions: AdminReadingQuestion[];
  total: number;
}

/** Builds the JSON body shared by create and update — omits fields not relevant to the type. */
function buildBody(input: AdminReadingFormInput, includeType: boolean): Record<string, unknown> {
  const body: Record<string, unknown> = { passage: input.passage };
  if (includeType) body.type = input.type;
  if (input.question !== undefined) body.question = input.question;
  if (input.blanks !== undefined) body.blanks = input.blanks;
  if (input.options !== undefined) body.options = input.options;
  if (input.paragraphs !== undefined) body.paragraphs = input.paragraphs;
  if (input.wordPool !== undefined) body.wordPool = input.wordPool;
  return body;
}

export const adminReadingService = {
  async list(type?: string, search?: string): Promise<AdminReadingQuestionsResponse> {
    try {
      const params: Record<string, string> = {};
      if (type) params.type = type;
      if (search) params.search = search;
      const { data } = await api.get<ApiResponse<AdminReadingQuestionsResponse>>(
        API_ENDPOINTS.admin.reading.list,
        { params }
      );
      return data.data as AdminReadingQuestionsResponse;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getOne(id: string): Promise<AdminReadingQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: AdminReadingQuestion }>>(
        API_ENDPOINTS.admin.reading.get(id)
      );
      return (data.data as { question: AdminReadingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async create(input: AdminReadingFormInput): Promise<AdminReadingQuestion> {
    try {
      const { data } = await api.post<ApiResponse<{ question: AdminReadingQuestion }>>(
        API_ENDPOINTS.admin.reading.create,
        buildBody(input, true)
      );
      return (data.data as { question: AdminReadingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async update(id: string, input: AdminReadingFormInput): Promise<AdminReadingQuestion> {
    try {
      const { data } = await api.put<ApiResponse<{ question: AdminReadingQuestion }>>(
        API_ENDPOINTS.admin.reading.update(id),
        buildBody(input, false)
      );
      return (data.data as { question: AdminReadingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.admin.reading.delete(id));
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async toggleStatus(id: string, isActive: boolean): Promise<AdminReadingQuestion> {
    try {
      const { data } = await api.patch<ApiResponse<{ question: AdminReadingQuestion }>>(
        API_ENDPOINTS.admin.reading.status(id),
        { isActive }
      );
      return (data.data as { question: AdminReadingQuestion }).question;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
