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
    all: (search?: string) => ['students', search ?? ''] as const,
    detail: (id: string) => ['students', id] as const,
  },
  student: {
    dashboardStats: () => ['student', 'dashboard-stats'] as const,
  },
  adminDashboard: {
    stats: () => ['admin', 'dashboard-stats'] as const,
  },
  adminQuestions: {
    list: (module: string, type: string, search?: string) =>
      ['admin', module, 'questions', type, search ?? ''] as const,
    all: (module: string) => ['admin', module, 'questions'] as const,
    detail: (module: string, id: string) => ['admin', module, 'question', id] as const,
  },
  adminMockTests: {
    list: (search?: string) => ['admin', 'mock-tests', search ?? ''] as const,
    all: () => ['admin', 'mock-tests'] as const,
  },
  speaking: {
    counts: () => ['speaking', 'counts'] as const,
    list: (type: string) => ['speaking', 'list', type] as const,
    detail: (type: string, id: string) => ['speaking', type, id] as const,
  },
  writing: {
    counts: () => ['writing', 'counts'] as const,
    list: (type: string) => ['writing', 'list', type] as const,
    detail: (type: string, id: string) => ['writing', type, id] as const,
  },
  reading: {
    counts: () => ['reading', 'counts'] as const,
    list: (type: string) => ['reading', 'list', type] as const,
    detail: (type: string, id: string) => ['reading', type, id] as const,
  },
  listening: {
    counts: () => ['listening', 'counts'] as const,
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
