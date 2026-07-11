import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import {
  readingScoreResultSchema,
  readingQuestionSchema,
  readingCountsSchema,
} from '@/lib/validations/reading';
import type {
  ApiResponse,
  ReadingCounts,
  ReadingQuestionListItem,
  ReadingQuestion,
  ReadingQuestionType,
  ReadingScoreResult,
} from '@/types';

export interface EvaluateReadingPayload {
  answers?: string[];
  answer?: string;
}

export const readingService = {
  async getCounts(): Promise<ReadingCounts> {
    try {
      const { data } = await api.get<ApiResponse<unknown>>(API_ENDPOINTS.reading.counts);
      return readingCountsSchema.parse(data.data);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async listByType(type: string): Promise<{ questions: ReadingQuestionListItem[]; total: number }> {
    try {
      const { data } = await api.get<
        ApiResponse<{ questions: ReadingQuestionListItem[]; total: number }>
      >(API_ENDPOINTS.reading.list(type));
      return data.data as { questions: ReadingQuestionListItem[]; total: number };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getQuestion(type: string, id: string): Promise<ReadingQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: unknown }>>(
        API_ENDPOINTS.reading.get(type, id)
      );
      return readingQuestionSchema.parse(data.data?.question) as ReadingQuestion;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getNext(type: string, id: string): Promise<ReadingQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: unknown }>>(
        API_ENDPOINTS.reading.next(type, id)
      );
      return readingQuestionSchema.parse(data.data?.question) as ReadingQuestion;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async evaluate(
    questionId: string,
    questionType: ReadingQuestionType,
    payload: EvaluateReadingPayload
  ): Promise<ReadingScoreResult> {
    try {
      const { data } = await api.post<ApiResponse<unknown>>(API_ENDPOINTS.reading.evaluate, {
        questionId,
        questionType,
        ...payload,
      });
      return readingScoreResultSchema.parse(data.data) as ReadingScoreResult;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
