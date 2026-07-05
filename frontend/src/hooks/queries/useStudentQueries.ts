'use client';

import { useQuery } from '@tanstack/react-query';
import { studentService } from '@/services/student.service';
import { queryKeys } from '@/constants/QueryKeys';

export function useDashboardStats() {
  const query = useQuery({
    queryKey: queryKeys.student.dashboardStats(),
    queryFn: () => studentService.getDashboardStats(),
    staleTime: 1000 * 60 * 2,
  });

  return { ...query, refreshStats: () => query.refetch() };
}
