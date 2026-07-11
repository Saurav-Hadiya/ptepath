'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminReadingService,
  type AdminReadingFormInput,
} from '@/services/admin-reading.service';
import { queryKeys } from '@/constants/QueryKeys';

/** Full unfiltered list — used by the hub page to derive per-type counts/avg scores. */
export function useAdminReadingHubList() {
  return useQuery({
    queryKey: queryKeys.adminQuestions.all('reading'),
    queryFn: () => adminReadingService.list(),
  });
}

export function useAdminReadingList(type: string, search?: string) {
  return useQuery({
    queryKey: queryKeys.adminQuestions.list('reading', type, search),
    queryFn: () => adminReadingService.list(type, search),
    enabled: !!type,
  });
}

export function useAdminReadingDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.adminQuestions.detail('reading', id),
    queryFn: () => adminReadingService.getOne(id),
    enabled: !!id,
  });
}

export function useAdminReadingCreate(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminReadingFormInput) => adminReadingService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('reading') });
      toast.success('Question added successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminReadingUpdate(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminReadingFormInput }) =>
      adminReadingService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('reading') });
      toast.success('Question updated successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminReadingDelete(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminReadingService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('reading') });
      toast.success('Question deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminReadingToggleStatus(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminReadingService.toggleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('reading') });
      toast.success('Status updated.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}
