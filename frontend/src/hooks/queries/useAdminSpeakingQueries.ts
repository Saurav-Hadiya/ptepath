'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminSpeakingService,
  type AdminSpeakingFormInput,
} from '@/services/admin-speaking.service';
import { queryKeys } from '@/constants/QueryKeys';

/** Full unfiltered list — used by the hub page to derive per-type counts/averages. */
export function useAdminSpeakingAllList() {
  return useQuery({
    queryKey: queryKeys.adminQuestions.all('speaking'),
    queryFn: () => adminSpeakingService.list(),
  });
}

export function useAdminSpeakingList(type: string, search?: string) {
  return useQuery({
    queryKey: queryKeys.adminQuestions.list('speaking', type, search),
    queryFn: () => adminSpeakingService.list(type, search),
    enabled: !!type,
  });
}

export function useAdminSpeakingQuestion(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminQuestions.detail('speaking', id ?? ''),
    queryFn: () => adminSpeakingService.getOne(id as string),
    enabled: !!id,
  });
}

export function useAdminSpeakingCreate(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminSpeakingFormInput) => adminSpeakingService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('speaking') });
      toast.success('Question added successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminSpeakingUpdate(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminSpeakingFormInput }) =>
      adminSpeakingService.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('speaking') });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.detail('speaking', variables.id) });
      toast.success('Question updated successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminSpeakingDelete(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminSpeakingService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('speaking') });
      toast.success('Question deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminSpeakingToggleStatus(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminSpeakingService.toggleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('speaking') });
      toast.success('Status updated.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminSpeakingTypeSettings(type: string) {
  return useQuery({
    queryKey: queryKeys.adminQuestions.typeSettings('speaking', type),
    queryFn: () => adminSpeakingService.getTypeSettings(type),
    enabled: !!type,
  });
}

export function useAdminSpeakingUpdateTypeSettings(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: { speakingTime?: number; preparationTime?: number }) =>
      adminSpeakingService.updateTypeSettings(type, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.all('speaking') });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestions.typeSettings('speaking', type) });
      toast.success('Timing updated for all questions of this type.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings.');
    },
  });
}
