export const ROUTES = {
  public: {
    landing: '/',
    login: '/login',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    changePassword: '/change-password',
  },

  student: {
    dashboard: '/dashboard',
    settings: '/settings',
    speaking: {
      home: '/speaking',
      type: (type: string) => `/speaking/${type}`,
      question: (type: string, id: string) => `/speaking/${type}/${id}`,
    },
    writing: {
      home: '/writing',
      type: (type: string) => `/writing/${type}`,
      question: (type: string, id: string) => `/writing/${type}/${id}`,
    },
    reading: {
      home: '/reading',
      type: (type: string) => `/reading/${type}`,
      question: (type: string, id: string) => `/reading/${type}/${id}`,
    },
    listening: {
      home: '/listening',
      type: (type: string) => `/listening/${type}`,
      question: (type: string, id: string) => `/listening/${type}/${id}`,
    },
    mockTests: {
      home: '/mock-tests',
      confirm: (id: string) => `/mock-tests/${id}/confirm`,
      attempt: '/mock-tests/attempt',
      result: '/mock-tests/result',
    },
  },

  admin: {
    dashboard: '/admin/dashboard',
    settings: '/admin/settings',
    students: '/admin/students',
    speaking: '/admin/speaking',
    writing: '/admin/writing',
    reading: '/admin/reading',
    listening: '/admin/listening',
    mockTests: '/admin/mock-tests',
  },
} as const;
