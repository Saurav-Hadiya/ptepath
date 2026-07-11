'use client';

import { useQuery } from '@tanstack/react-query';
import { adminStudentService } from '@/services/admin-student.service';
import { queryKeys } from '@/constants/QueryKeys';

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: queryKeys.adminDashboard.stats(),
    queryFn: () => adminStudentService.getDashboardStats(),
    staleTime: 1000 * 60 * 2,
  });
}
