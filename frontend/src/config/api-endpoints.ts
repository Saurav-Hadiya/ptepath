export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    updatePassword: '/auth/update-password',
  },

  student: {
    dashboardStats: '/student/dashboard-stats',
  },

  admin: {
    dashboardStats: '/admin/dashboard-stats',
    students: {
      list: '/admin/students',
      create: '/admin/students',
      get: (id: string) => `/admin/students/${id}`,
      update: (id: string) => `/admin/students/${id}`,
      delete: (id: string) => `/admin/students/${id}`,
      resetPassword: (id: string) => `/admin/students/${id}/reset-password`,
      status: (id: string) => `/admin/students/${id}/status`,
    },
    speaking: {
      list: '/admin/speaking/questions',
      create: '/admin/speaking/questions',
      get: (id: string) => `/admin/speaking/questions/${id}`,
      update: (id: string) => `/admin/speaking/questions/${id}`,
      delete: (id: string) => `/admin/speaking/questions/${id}`,
      status: (id: string) => `/admin/speaking/questions/${id}/status`,
      typeSettings: (type: string) => `/admin/speaking/type-settings/${type}`,
    },
    writing: {
      list: '/admin/writing/questions',
      create: '/admin/writing/questions',
      get: (id: string) => `/admin/writing/questions/${id}`,
      update: (id: string) => `/admin/writing/questions/${id}`,
      delete: (id: string) => `/admin/writing/questions/${id}`,
      status: (id: string) => `/admin/writing/questions/${id}/status`,
    },
    reading: {
      list: '/admin/reading/questions',
      create: '/admin/reading/questions',
      get: (id: string) => `/admin/reading/questions/${id}`,
      update: (id: string) => `/admin/reading/questions/${id}`,
      delete: (id: string) => `/admin/reading/questions/${id}`,
      status: (id: string) => `/admin/reading/questions/${id}/status`,
    },
    listening: {
      list: '/admin/listening/questions',
      create: '/admin/listening/questions',
      get: (id: string) => `/admin/listening/questions/${id}`,
      update: (id: string) => `/admin/listening/questions/${id}`,
      delete: (id: string) => `/admin/listening/questions/${id}`,
      typeSettings: (type: string) => `/admin/listening/type-settings/${type}`,
      status: (id: string) => `/admin/listening/questions/${id}/status`,
    },
    mockTests: {
      list: '/admin/mock-tests',
      create: '/admin/mock-tests',
      get: (id: string) => `/admin/mock-tests/${id}`,
      update: (id: string) => `/admin/mock-tests/${id}`,
      delete: (id: string) => `/admin/mock-tests/${id}`,
      status: (id: string) => `/admin/mock-tests/${id}/status`,
    },
    resources: {
      list: '/admin/resources',
      create: '/admin/resources',
      get: (id: string) => `/admin/resources/${id}`,
      update: (id: string) => `/admin/resources/${id}`,
      delete: (id: string) => `/admin/resources/${id}`,
      status: (id: string) => `/admin/resources/${id}/status`,
    },
  },

  speaking: {
    counts: '/speaking/questions/counts',
    list: (type: string) => `/speaking/questions/${type}`,
    random: (type: string) => `/speaking/question/${type}/random`,
    next: (type: string, id: string) => `/speaking/question/${type}/${id}/next`,
    get: (type: string, id: string) => `/speaking/question/${type}/${id}`,
    evaluate: {
      readAloud: '/speaking/evaluate/read-aloud',
      repeatSentence: '/speaking/evaluate/repeat-sentence',
      describeImage: '/speaking/evaluate/describe-image',
      respondSituation: '/speaking/evaluate/respond-situation',
      answerShort: '/speaking/evaluate/answer-short',
    },
  },

  writing: {
    counts: '/writing/questions/counts',
    list: (type: string) => `/writing/questions/${type}`,
    random: (type: string) => `/writing/${type}/random`,
    next: (type: string, id: string) => `/writing/${type}/${id}/next`,
    get: (type: string, id: string) => `/writing/${type}/${id}`,
    evaluate: {
      summarise: '/writing/evaluate/summarise',
      essay: '/writing/evaluate/essay',
    },
  },

  reading: {
    counts: '/reading/questions/counts',
    list: (type: string) => `/reading/questions/${type}`,
    random: (type: string) => `/reading/${type}/random`,
    next: (type: string, id: string) => `/reading/${type}/${id}/next`,
    get: (type: string, id: string) => `/reading/${type}/${id}`,
    evaluate: '/reading/evaluate',
  },

  listening: {
    counts: '/listening/questions/counts',
    list: (type: string) => `/listening/questions/${type}`,
    random: (type: string) => `/listening/${type}/random`,
    next: (type: string, id: string) => `/listening/${type}/${id}/next`,
    get: (type: string, id: string) => `/listening/${type}/${id}`,
    evaluate: '/listening/evaluate',
  },

  mockTests: {
    list: '/mock-tests',
    get: (id: string) => `/mock-tests/${id}`,
    start: (id: string) => `/mock-tests/${id}/start`,
    submit: (id: string) => `/mock-tests/${id}/submit`,
  },

  resources: {
    list: '/resources',
    get: (id: string) => `/resources/${id}`,
  },
} as const;
