'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { mockTestService } from '@/services/mocktest.service';
import { queryKeys } from '@/constants/QueryKeys';
import type { MockTestSubmitPayload } from '@/types';

export function useMockTestTemplates() {
  return useQuery({
    queryKey: queryKeys.mockTests.all(),
    queryFn: () => mockTestService.listTemplates(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useMockTestTemplateDetail(templateId: string) {
  return useQuery({
    queryKey: queryKeys.mockTests.detail(templateId),
    queryFn: () => mockTestService.getTemplateDetail(templateId),
    staleTime: 1000 * 60 * 2,
    enabled: !!templateId,
  });
}

export function useStartMockTest() {
  return useMutation({
    mutationFn: (templateId: string) => mockTestService.startTest(templateId),
  });
}

export function useSubmitMockTest() {
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: MockTestSubmitPayload }) =>
      mockTestService.submitTest(templateId, payload),
  });
}
