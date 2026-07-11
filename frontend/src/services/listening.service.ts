import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import {
  listeningCountsSchema,
  listeningQuestionSchema,
  listeningScoreResultSchema,
} from '@/lib/validations/listening';
import type {
  ApiResponse,
  ListeningCounts,
  ListeningQuestionListItem,
  ListeningQuestion,
  ListeningQuestionType,
  ListeningScoreResult,
} from '@/types';

export interface EvaluateListeningPayload {
  answer?: string;
  answers?: Array<string | number>;
}

export const listeningService = {
  async getCounts(): Promise<ListeningCounts> {
    try {
      const { data } = await api.get<ApiResponse<unknown>>(API_ENDPOINTS.listening.counts);
      return listeningCountsSchema.parse(data.data);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async listByType(type: string): Promise<{ questions: ListeningQuestionListItem[]; total: number }> {
    try {
      const { data } = await api.get<
        ApiResponse<{ questions: ListeningQuestionListItem[]; total: number }>
      >(API_ENDPOINTS.listening.list(type));
      return data.data as { questions: ListeningQuestionListItem[]; total: number };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getQuestion(type: string, id: string): Promise<ListeningQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: unknown }>>(
        API_ENDPOINTS.listening.get(type, id)
      );
      return listeningQuestionSchema.parse(data.data?.question) as ListeningQuestion;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getNext(type: string, id: string): Promise<ListeningQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: unknown }>>(
        API_ENDPOINTS.listening.next(type, id)
      );
      return listeningQuestionSchema.parse(data.data?.question) as ListeningQuestion;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async evaluate(
    questionId: string,
    questionType: ListeningQuestionType,
    payload: EvaluateListeningPayload
  ): Promise<ListeningScoreResult> {
    try {
      const { data } = await api.post<ApiResponse<unknown>>(API_ENDPOINTS.listening.evaluate, {
        questionId,
        questionType,
        ...payload,
      });
      return listeningScoreResultSchema.parse(data.data) as ListeningScoreResult;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
