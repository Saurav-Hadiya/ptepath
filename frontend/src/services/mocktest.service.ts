import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import {
  mockTestTemplateListSchema,
  mockTestTemplateSummarySchema,
  mockTestStartSchema,
  mockTestResultSchema,
} from '@/lib/validations/mocktest';
import type {
  ApiResponse,
  MockTestResult,
  MockTestStartData,
  MockTestSubmitPayload,
  MockTestTemplateSummary,
} from '@/types';

export const mockTestService = {
  async listTemplates(): Promise<MockTestTemplateSummary[]> {
    try {
      const { data } = await api.get<ApiResponse<{ templates: unknown }>>(API_ENDPOINTS.mockTests.list);
      return mockTestTemplateListSchema.parse(data.data?.templates) as MockTestTemplateSummary[];
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getTemplateDetail(templateId: string): Promise<MockTestTemplateSummary> {
    try {
      const { data } = await api.get<ApiResponse<{ template: unknown }>>(API_ENDPOINTS.mockTests.get(templateId));
      return mockTestTemplateSummarySchema.parse(data.data?.template) as MockTestTemplateSummary;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async startTest(templateId: string): Promise<MockTestStartData> {
    try {
      const { data } = await api.post<ApiResponse<unknown>>(API_ENDPOINTS.mockTests.start(templateId));
      return mockTestStartSchema.parse(data.data) as MockTestStartData;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async submitTest(templateId: string, payload: MockTestSubmitPayload): Promise<MockTestResult> {
    try {
      const { data } = await api.post<ApiResponse<unknown>>(
        API_ENDPOINTS.mockTests.submit(templateId),
        payload
      );
      return mockTestResultSchema.parse(data.data) as MockTestResult;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
