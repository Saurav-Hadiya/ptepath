'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminListeningService,
  type AdminListeningFormInput,
} from '@/services/admin-listening.service';
import { queryKeys } from '@/constants/QueryKeys';

/** Full unfiltered list — used by the hub page to derive per-type counts/avg scores. */
export function useAdminListeningHubList() {
  return useQuery({
    queryKey: queryKeys.adminQuestions.all('listening'),
    queryFn: () => adminListeningService.list(),
  });
}

export function useAdminListeningList(type: string, search?: string) {
  return useQuery({
    queryKey: queryKeys.adminQuestions.list('listening', type, search),
    queryFn: () => adminListeningService.list(type, search),
    enabled: !!type,
  });
}

export function useAdminListeningDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.adminQuestions.detail('listening', id),
    queryFn: () => adminListeningService.getOne(id),
    enabled: !!id,
  });
}

export function useAdminListeningCreate(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminListeningFormInput) => adminListeningService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('listening') });
      toast.success('Question added successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminListeningUpdate(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminListeningFormInput }) =>
      adminListeningService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('listening') });
      toast.success('Question updated successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminListeningDelete(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminListeningService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('listening') });
      toast.success('Question deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminListeningToggleStatus(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminListeningService.toggleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('listening') });
      toast.success('Status updated.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}
