'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { writingService } from '@/services/writing.service';
import { queryKeys } from '@/constants/QueryKeys';

export function useWritingCounts() {
  return useQuery({
    queryKey: queryKeys.writing.counts(),
    queryFn: () => writingService.getCounts(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useWritingList(type: string) {
  return useQuery({
    queryKey: queryKeys.writing.list(type),
    queryFn: () => writingService.listByType(type),
    staleTime: 1000 * 60 * 2,
    enabled: !!type,
  });
}

export function useWritingQuestion(type: string, id: string) {
  return useQuery({
    queryKey: queryKeys.writing.detail(type, id),
    queryFn: () => writingService.getQuestion(type, id),
    staleTime: 1000 * 60 * 5,
    enabled: !!type && !!id,
  });
}

export function useWritingNext() {
  return useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) => writingService.getNext(type, id),
  });
}

export function useSubmitSummarise() {
  return useMutation({
    mutationFn: ({ questionId, responseText }: { questionId: string; responseText: string }) =>
      writingService.submitSummarise(questionId, responseText),
  });
}

export function useSubmitEssay() {
  return useMutation({
    mutationFn: ({ questionId, responseText }: { questionId: string; responseText: string }) =>
      writingService.submitEssay(questionId, responseText),
  });
}
