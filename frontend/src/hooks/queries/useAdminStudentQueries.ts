'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminStudentService,
  type CreateStudentPayload,
  type UpdateStudentPayload,
} from '@/services/admin-student.service';
import { queryKeys } from '@/constants/QueryKeys';

export function useAdminStudents(search?: string) {
  return useQuery({
    queryKey: queryKeys.students.all(search),
    queryFn: () => adminStudentService.list(search),
    staleTime: 1000 * 60,
  });
}

export function useAdminStudent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.detail(id ?? ''),
    queryFn: () => adminStudentService.getOne(id as string),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentPayload) => adminStudentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.base() });
      toast.success('Student created successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStudentPayload }) =>
      adminStudentService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.base() });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(variables.id) });
      toast.success('Student updated successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useResetStudentPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, temporaryPassword }: { id: string; temporaryPassword: string }) =>
      adminStudentService.resetPassword(id, temporaryPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.base() });
      toast.success('Password reset. Student must change it on next login.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useToggleStudentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminStudentService.toggleStatus(id, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.base() });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(variables.id) });
      toast.success('Status updated.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminStudentService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.base() });
      toast.success('Student deleted successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
