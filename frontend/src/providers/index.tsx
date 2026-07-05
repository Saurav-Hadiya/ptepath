'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { getQueryClient } from '@/lib/query-client';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
