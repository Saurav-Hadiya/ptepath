/**
 * Centralized TanStack Query key factory.
 * All queryKey values across the app must come from here — never hardcode them inline.
 */
export const queryKeys = {
  auth: {
    session: () => ['auth', 'session'] as const,
    me: () => ['auth', 'me'] as const,
  },
  students: {
    all: () => ['students'] as const,
    detail: (id: string) => ['students', id] as const,
  },
  speaking: {
    list: (type: string) => ['speaking', 'list', type] as const,
    detail: (type: string, id: string) => ['speaking', type, id] as const,
  },
  writing: {
    list: (type: string) => ['writing', 'list', type] as const,
    detail: (type: string, id: string) => ['writing', type, id] as const,
  },
  reading: {
    list: (type: string) => ['reading', 'list', type] as const,
    detail: (type: string, id: string) => ['reading', type, id] as const,
  },
  listening: {
    list: (type: string) => ['listening', 'list', type] as const,
    detail: (type: string, id: string) => ['listening', type, id] as const,
  },
  mockTests: {
    all: () => ['mock-tests'] as const,
    detail: (id: string) => ['mock-tests', id] as const,
  },
  resources: {
    all: () => ['resources'] as const,
    detail: (id: string) => ['resources', id] as const,
  },
} as const;
