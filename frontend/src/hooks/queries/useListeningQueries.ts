'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { listeningService } from '@/services/listening.service';
import { queryKeys } from '@/constants/QueryKeys';
import type { ListeningQuestionType } from '@/types';

export function useListeningCounts() {
  return useQuery({
    queryKey: queryKeys.listening.counts(),
    queryFn: () => listeningService.getCounts(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useListeningList(type: string) {
  return useQuery({
    queryKey: queryKeys.listening.list(type),
    queryFn: () => listeningService.listByType(type),
    staleTime: 1000 * 60 * 2,
    enabled: !!type,
  });
}

export function useListeningQuestion(type: string, id: string) {
  return useQuery({
    queryKey: queryKeys.listening.detail(type, id),
    queryFn: () => listeningService.getQuestion(type, id),
    staleTime: 1000 * 60 * 5,
    enabled: !!type && !!id,
  });
}

export function useListeningNext() {
  return useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) => listeningService.getNext(type, id),
  });
}

export function useSubmitListening() {
  return useMutation({
    mutationFn: ({
      questionId,
      questionType,
      answer,
      answers,
    }: {
      questionId: string;
      questionType: ListeningQuestionType;
      answer?: string;
      answers?: Array<string | number>;
    }) => listeningService.evaluate(questionId, questionType, { answer, answers }),
  });
}
