import { QueryClient } from '@tanstack/react-query';

const queryConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
};

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new QueryClient per request (no cross-request leakage)
    return new QueryClient(queryConfig);
  }
  // Browser: reuse a singleton so React Suspense re-renders don't recreate it
  if (!browserQueryClient) browserQueryClient = new QueryClient(queryConfig);
  return browserQueryClient;
}
