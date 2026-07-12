'use client';

import { useQuery } from '@tanstack/react-query';
import { resourceService } from '@/services/resource.service';
import { queryKeys } from '@/constants/QueryKeys';

export function useResourceList() {
  return useQuery({
    queryKey: queryKeys.resources.all(),
    queryFn: () => resourceService.list(),
  });
}

export function useResourceDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.resources.detail(id),
    queryFn: () => resourceService.getOne(id),
    enabled: !!id,
  });
}
