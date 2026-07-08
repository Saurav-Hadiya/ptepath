'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { readingService } from '@/services/reading.service';
import { queryKeys } from '@/constants/QueryKeys';
import type { ReadingQuestionType } from '@/types';

export function useReadingCounts() {
  return useQuery({
    queryKey: queryKeys.reading.counts(),
    queryFn: () => readingService.getCounts(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useReadingList(type: string) {
  return useQuery({
    queryKey: queryKeys.reading.list(type),
    queryFn: () => readingService.listByType(type),
    staleTime: 1000 * 60 * 2,
    enabled: !!type,
  });
}

export function useReadingQuestion(type: string, id: string) {
  return useQuery({
    queryKey: queryKeys.reading.detail(type, id),
    queryFn: () => readingService.getQuestion(type, id),
    staleTime: 1000 * 60 * 5,
    enabled: !!type && !!id,
  });
}

export function useReadingNext() {
  return useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) => readingService.getNext(type, id),
  });
}

export function useSubmitReading() {
  return useMutation({
    mutationFn: ({
      questionId,
      questionType,
      answers,
      answer,
    }: {
      questionId: string;
      questionType: ReadingQuestionType;
      answers?: string[];
      answer?: string;
    }) => readingService.evaluate(questionId, questionType, { answers, answer }),
  });
}
