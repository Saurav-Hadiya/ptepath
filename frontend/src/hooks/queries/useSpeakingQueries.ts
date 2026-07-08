'use client';

import { useQuery } from '@tanstack/react-query';
import { speakingService } from '@/services/speaking.service';
import { queryKeys } from '@/constants/QueryKeys';

export function useSpeakingCounts() {
  return useQuery({
    queryKey: queryKeys.speaking.counts(),
    queryFn: () => speakingService.getCounts(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSpeakingList(type: string) {
  return useQuery({
    queryKey: queryKeys.speaking.list(type),
    queryFn: () => speakingService.listByType(type),
    staleTime: 1000 * 60 * 2,
    enabled: !!type,
  });
}

export function useSpeakingQuestion(type: string, id: string) {
  return useQuery({
    queryKey: queryKeys.speaking.detail(type, id),
    queryFn: () => speakingService.getQuestion(type, id),
    staleTime: 1000 * 60 * 5,
    enabled: !!type && !!id,
  });
}
