import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry(failureCount, error) {
          const status =
            error && typeof error === 'object' && 'status' in error
              ? (error as { status?: number }).status
              : undefined;
          return status !== 401 && status !== 403 && failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
