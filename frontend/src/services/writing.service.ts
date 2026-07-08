import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import {
  writingScoreResultSchema,
  writingQuestionSchema,
  writingCountsSchema,
} from '@/lib/validations/writing';
import type {
  ApiResponse,
  WritingCounts,
  WritingQuestionListItem,
  WritingQuestion,
  WritingScoreResult,
} from '@/types';

async function postEvaluate(endpoint: string, body: unknown): Promise<WritingScoreResult> {
  try {
    const { data } = await api.post<ApiResponse<unknown>>(endpoint, body);
    return writingScoreResultSchema.parse(data.data);
  } catch (error) {
    throw normalizeError(error);
  }
}

export const writingService = {
  async getCounts(): Promise<WritingCounts> {
    try {
      const { data } = await api.get<ApiResponse<unknown>>(API_ENDPOINTS.writing.counts);
      return writingCountsSchema.parse(data.data);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async listByType(type: string): Promise<{ questions: WritingQuestionListItem[]; total: number }> {
    try {
      const { data } = await api.get<
        ApiResponse<{ questions: WritingQuestionListItem[]; total: number }>
      >(API_ENDPOINTS.writing.list(type));
      return data.data as { questions: WritingQuestionListItem[]; total: number };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getQuestion(type: string, id: string): Promise<WritingQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: unknown }>>(
        API_ENDPOINTS.writing.get(type, id)
      );
      return writingQuestionSchema.parse(data.data?.question) as WritingQuestion;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getNext(type: string, id: string): Promise<WritingQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: unknown }>>(
        API_ENDPOINTS.writing.next(type, id)
      );
      return writingQuestionSchema.parse(data.data?.question) as WritingQuestion;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async submitSummarise(questionId: string, responseText: string): Promise<WritingScoreResult> {
    return postEvaluate(API_ENDPOINTS.writing.evaluate.summarise, { questionId, responseText });
  },

  async submitEssay(questionId: string, responseText: string): Promise<WritingScoreResult> {
    return postEvaluate(API_ENDPOINTS.writing.evaluate.essay, { questionId, responseText });
  },
};
