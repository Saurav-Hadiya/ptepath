'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminWritingService,
  type AdminWritingFormInput,
  type AdminWritingUpdateInput,
} from '@/services/admin-writing.service';
import { queryKeys } from '@/constants/QueryKeys';

/** Full unfiltered list — used by the hub page to derive per-type counts/averages. */
export function useAdminWritingAllList() {
  return useQuery({
    queryKey: queryKeys.adminQuestions.all('writing'),
    queryFn: () => adminWritingService.list(),
  });
}

export function useAdminWritingList(type: string, search?: string) {
  return useQuery({
    queryKey: queryKeys.adminQuestions.list('writing', type, search),
    queryFn: () => adminWritingService.list(type, search),
    enabled: !!type,
  });
}

export function useAdminWritingQuestion(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminQuestions.detail('writing', id ?? ''),
    queryFn: () => adminWritingService.getOne(id as string),
    enabled: !!id,
  });
}

export function useAdminWritingCreate(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminWritingFormInput) => adminWritingService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('writing') });
      toast.success('Question added successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminWritingUpdate(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminWritingUpdateInput }) =>
      adminWritingService.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('writing') });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.detail('writing', variables.id) });
      toast.success('Question updated successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminWritingDelete(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminWritingService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('writing') });
      toast.success('Question deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminWritingToggleStatus(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminWritingService.toggleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('writing') });
      toast.success('Status updated.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}
