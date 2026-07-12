'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminResourceService,
  type AdminResourceCreateInput,
  type AdminResourceUpdateInput,
} from '@/services/admin-resource.service';
import { queryKeys } from '@/constants/QueryKeys';

export function useAdminResourceList() {
  return useQuery({
    queryKey: queryKeys.adminResources.all(),
    queryFn: () => adminResourceService.list(),
  });
}

export function useAdminResourceDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.adminResources.detail(id),
    queryFn: () => adminResourceService.getOne(id),
    enabled: !!id,
  });
}

export function useAdminResourceCreate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminResourceCreateInput) => adminResourceService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminResources.all() });
      toast.success('Resource uploaded successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload resource. Please try again.');
    },
  });
}

export function useAdminResourceUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminResourceUpdateInput }) =>
      adminResourceService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminResources.all() });
      toast.success('Resource updated successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save. Please try again.');
    },
  });
}

export function useAdminResourceDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminResourceService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminResources.all() });
      toast.success('Resource deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete. Please try again.');
    },
  });
}

export function useAdminResourceToggleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminResourceService.toggleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminResources.all() });
      toast.success('Status updated.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status. Please try again.');
    },
  });
}
