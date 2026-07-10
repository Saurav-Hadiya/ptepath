'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminMockTestService,
  type MockTestTemplatePayload,
} from '@/services/admin-mocktest.service';
import { queryKeys } from '@/constants/QueryKeys';

export function useAdminMockTestDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminMockTests.detail(id ?? ''),
    queryFn: () => adminMockTestService.getOne(id as string),
    enabled: !!id,
  });
}

export function useAdminMockTestList(search?: string) {
  return useQuery({
    queryKey: queryKeys.adminMockTests.list(search),
    queryFn: () => adminMockTestService.list(search),
    staleTime: 1000 * 60,
  });
}

export function useCreateMockTestTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MockTestTemplatePayload) => adminMockTestService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminMockTests.all() });
      toast.success('Template saved.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateMockTestTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MockTestTemplatePayload> }) =>
      adminMockTestService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminMockTests.all() });
      toast.success('Template saved.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteMockTestTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminMockTestService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminMockTests.all() });
      toast.success('Template deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useToggleMockTestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminMockTestService.toggleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminMockTests.all() });
      toast.success('Status updated.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
