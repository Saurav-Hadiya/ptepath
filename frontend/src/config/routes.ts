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
    students: {
      home: '/admin/students',
      new: '/admin/students/new',
      detail: (id: string) => `/admin/students/${id}`,
    },
    speaking: {
      home: '/admin/speaking',
      type: (type: string) => `/admin/speaking/${type}`,
      new: (type: string) => `/admin/speaking/${type}/new`,
      edit: (type: string, id: string) => `/admin/speaking/${type}/${id}/edit`,
    },
    writing: {
      home: '/admin/writing',
      type: (type: string) => `/admin/writing/${type}`,
      new: (type: string) => `/admin/writing/${type}/new`,
      edit: (type: string, id: string) => `/admin/writing/${type}/${id}/edit`,
    },
    reading: {
      home: '/admin/reading',
      type: (type: string) => `/admin/reading/${type}`,
      new: (type: string) => `/admin/reading/${type}/new`,
      edit: (type: string, id: string) => `/admin/reading/${type}/${id}/edit`,
    },
    listening: {
      home: '/admin/listening',
      type: (type: string) => `/admin/listening/${type}`,
      new: (type: string) => `/admin/listening/${type}/new`,
      edit: (type: string, id: string) => `/admin/listening/${type}/${id}/edit`,
    },
    mockTests: {
      home: '/admin/mock-tests',
      new: '/admin/mock-tests/new',
      edit: (id: string) => `/admin/mock-tests/${id}/edit`,
    },
  },
} as const;
