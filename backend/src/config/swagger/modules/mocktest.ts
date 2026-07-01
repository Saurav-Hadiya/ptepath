/** OpenAPI tags, schemas and paths for the Mock Test module. */

const MODULE_ENUM = ['speaking', 'writing', 'reading', 'listening'];

export const mocktestTags = [
  {
    name: 'Mock Test Management',
    description:
      'Admin-only CRUD for mock test templates. A template defines, per module + question type, how many questions to draw from the bank (questionRules).',
  },
  {
    name: 'Mock Test',
    description:
      'Student mock tests — list active templates, start an attempt (random question set with correct answers stripped), and submit all answers for scoring. Speaking answers are pre-scored during the test; every other module is scored server-side using the existing module scorers. No per-attempt records are stored.',
  },
];

export const mocktestSchemas = {
  QuestionRule: {
    type: 'object',
    required: ['module', 'type', 'count'],
    properties: {
      module: { type: 'string', enum: MODULE_ENUM, example: 'reading' },
      type: {
        type: 'string',
        description: 'A question type valid for the given module.',
        example: 'mcq_single',
      },
      count: { type: 'integer', minimum: 1, example: 1 },
    },
  },
  MockTestTemplateAdmin: {
    type: 'object',
    description: 'Admin-facing template — full document including stats.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      name: { type: 'string', example: 'Standard Mock Test' },
      description: { type: 'string', example: 'Full-length practice test across all four modules.' },
      totalTime: { type: 'integer', description: 'Total time in minutes.', example: 90 },
      questionRules: { type: 'array', items: { $ref: '#/components/schemas/QuestionRule' } },
      totalQuestions: { type: 'integer', example: 9 },
      isActive: { type: 'boolean', example: true },
      attemptCount: { type: 'integer', example: 12 },
      avgScore: { type: 'number', format: 'float', example: 71.6 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  MockTestTemplateStudent: {
    type: 'object',
    description: 'Student-facing template — no attemptCount or avgScore exposed.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      name: { type: 'string', example: 'Standard Mock Test' },
      description: { type: 'string', example: 'Full-length practice test across all four modules.' },
      totalTime: { type: 'integer', example: 90 },
      questionRules: { type: 'array', items: { $ref: '#/components/schemas/QuestionRule' } },
      totalQuestions: { type: 'integer', example: 9 },
    },
  },
  MockTestStartQuestion: {
    type: 'object',
    description:
      'One generated question. `questionData` carries module-specific fields with all correct answers stripped (MCQ options omit isCorrect, blanks omit correctAnswer/correctWord, reorder paragraphs shuffled and label-less, listening omits correctSentence/incorrectWordIndices). speakingTime/preparationTime are non-null for speaking only.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      module: { type: 'string', enum: MODULE_ENUM, example: 'reading' },
      questionType: { type: 'string', example: 'mcq_single' },
      questionData: { type: 'object', additionalProperties: true },
      speakingTime: { type: 'integer', nullable: true, example: null },
      preparationTime: { type: 'integer', nullable: true, example: null },
    },
  },
  MockTestStartResponse: {
    type: 'object',
    properties: {
      templateId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      templateName: { type: 'string', example: 'Standard Mock Test' },
      totalTime: { type: 'integer', description: 'Minutes.', example: 90 },
      totalQuestions: { type: 'integer', example: 9 },
      questions: { type: 'array', items: { $ref: '#/components/schemas/MockTestStartQuestion' } },
    },
  },
  MockTestModuleResult: {
    type: 'object',
    properties: {
      score: { type: 'number', format: 'float', example: 79.8 },
      displayScore: { type: 'string', example: '72 / 90' },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            questionId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            questionType: { type: 'string', example: 'mcq_single' },
            score: { type: 'number', format: 'float', example: 100 },
            displayScore: { type: 'string', example: '90 / 90' },
            breakdown: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
              description:
                'Type-specific result revealing the correct answers. null when the underlying question could not be found (scores 0). For speaking it is { preScored: boolean }.',
            },
          },
        },
      },
    },
  },
  MockTestResult: {
    type: 'object',
    properties: {
      overallScore: { type: 'number', format: 'float', example: 74.2 },
      displayScore: { type: 'string', example: '67 / 90' },
      timeTaken: { type: 'integer', description: 'Minutes.', example: 67 },
      questionsAnswered: { type: 'integer', example: 9 },
      modules: {
        type: 'object',
        properties: {
          speaking: { $ref: '#/components/schemas/MockTestModuleResult' },
          writing: { $ref: '#/components/schemas/MockTestModuleResult' },
          reading: { $ref: '#/components/schemas/MockTestModuleResult' },
          listening: { $ref: '#/components/schemas/MockTestModuleResult' },
        },
      },
    },
  },
};

const templateRequestBody = {
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['name', 'description', 'totalTime', 'questionRules'],
        properties: {
          name: { type: 'string', example: 'Standard Mock Test' },
          description: { type: 'string', example: 'Full-length practice test across all four modules.' },
          totalTime: { type: 'integer', minimum: 10, example: 90 },
          questionRules: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/QuestionRule' },
          },
        },
      },
      example: {
        name: 'Standard Mock Test',
        description: 'Full-length practice test across all four modules.',
        totalTime: 90,
        questionRules: [
          { module: 'speaking', type: 'read_aloud', count: 1 },
          { module: 'writing', type: 'write_essay', count: 1 },
          { module: 'reading', type: 'mcq_single', count: 1 },
          { module: 'reading', type: 'reorder_paragraphs', count: 1 },
          { module: 'listening', type: 'write_dictation', count: 1 },
        ],
      },
    },
  },
};

const idParam = [
  {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string' },
    description: 'Mock test template ID.',
  },
];

const notFound = (message: string) => ({
  description: 'Template not found.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: { success: false, message },
    },
  },
});

const validationError = (message: string) => ({
  description: 'Validation error.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: { success: false, message },
    },
  },
});

export const mocktestPaths = {
  // ─── Admin ────────────────────────────────────────────────
  '/admin/mock-tests': {
    post: {
      tags: ['Mock Test Management'],
      summary: 'Create a mock test template',
      description:
        'Creates a template. Each questionRule needs a module, a question type valid for that module, and a count ≥ 1. totalTime is in minutes (min 10).',
      operationId: 'createMockTestTemplate',
      security: [{ bearerAuth: [] }],
      requestBody: templateRequestBody,
      responses: {
        201: {
          description: 'Template created.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Template created successfully.' },
                  data: {
                    type: 'object',
                    properties: { template: { $ref: '#/components/schemas/MockTestTemplateAdmin' } },
                  },
                },
              },
            },
          },
        },
        400: validationError('At least one question rule is required.'),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
    get: {
      tags: ['Mock Test Management'],
      summary: 'List all mock test templates',
      description: 'Returns all templates (active and inactive) sorted newest first, with stats.',
      operationId: 'listMockTestTemplates',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of templates.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Templates retrieved successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      templates: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/MockTestTemplateAdmin' },
                      },
                      total: { type: 'integer', example: 1 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/admin/mock-tests/{id}': {
    parameters: idParam,
    get: {
      tags: ['Mock Test Management'],
      summary: 'Get one mock test template',
      operationId: 'getMockTestTemplate',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Template found.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Template retrieved successfully.' },
                  data: {
                    type: 'object',
                    properties: { template: { $ref: '#/components/schemas/MockTestTemplateAdmin' } },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: notFound('Template not found.'),
      },
    },
    put: {
      tags: ['Mock Test Management'],
      summary: 'Update a mock test template',
      description: 'Updates the provided fields only (name, description, totalTime, questionRules).',
      operationId: 'updateMockTestTemplate',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                totalTime: { type: 'integer', minimum: 10 },
                questionRules: {
                  type: 'array',
                  minItems: 1,
                  items: { $ref: '#/components/schemas/QuestionRule' },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Template updated.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Template updated successfully.' },
                  data: {
                    type: 'object',
                    properties: { template: { $ref: '#/components/schemas/MockTestTemplateAdmin' } },
                  },
                },
              },
            },
          },
        },
        400: validationError('At least one field must be provided to update.'),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: notFound('Template not found.'),
      },
    },
    delete: {
      tags: ['Mock Test Management'],
      summary: 'Delete a mock test template',
      operationId: 'deleteMockTestTemplate',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Template deleted.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessMessage' },
              example: { success: true, message: 'Template deleted.' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: notFound('Template not found.'),
      },
    },
  },
  '/admin/mock-tests/{id}/status': {
    parameters: idParam,
    patch: {
      tags: ['Mock Test Management'],
      summary: 'Toggle template active status',
      description: 'Sets `isActive` to the provided boolean.',
      operationId: 'toggleMockTestTemplateStatus',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['isActive'],
              properties: { isActive: { type: 'boolean', example: false } },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Status updated.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Template deactivated.' },
                  data: {
                    type: 'object',
                    properties: { template: { $ref: '#/components/schemas/MockTestTemplateAdmin' } },
                  },
                },
              },
            },
          },
        },
        400: validationError('isActive must be a boolean (true or false).'),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: notFound('Template not found.'),
      },
    },
  },
  // ─── Student ──────────────────────────────────────────────
  '/mock-tests': {
    get: {
      tags: ['Mock Test'],
      summary: 'List active mock test templates',
      description: 'Returns all active templates (newest first) with safe fields only.',
      operationId: 'listActiveMockTests',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of active templates.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Templates retrieved successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      templates: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/MockTestTemplateStudent' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/mock-tests/{id}': {
    parameters: idParam,
    get: {
      tags: ['Mock Test'],
      summary: 'Get one active template (student view)',
      operationId: 'getActiveMockTest',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Template found.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Template retrieved successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      template: { $ref: '#/components/schemas/MockTestTemplateStudent' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: notFound('Template not found.'),
      },
    },
  },
  '/mock-tests/{id}/start': {
    parameters: idParam,
    post: {
      tags: ['Mock Test'],
      summary: 'Start a mock test',
      description:
        'Generates a random question set per the template rules. Correct answers are stripped from every question. Not enough questions for a type → uses all available; none available → that type is skipped (no error). Questions are ordered speaking → writing → reading → listening.',
      operationId: 'startMockTest',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Generated question set.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Mock test started.' },
                  data: { $ref: '#/components/schemas/MockTestStartResponse' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: notFound('Mock test not found.'),
      },
    },
  },
  '/mock-tests/{id}/submit': {
    parameters: idParam,
    post: {
      tags: ['Mock Test'],
      summary: 'Submit a mock test',
      description:
        'Scores every answer with the existing module scorers. Speaking answers send a pre-scored `score` (null → 0); all other modules send the raw `answer` and are scored server-side. Module score = average of its question scores; overall = average of the module averages that had ≥ 1 answer. Template and student counters are updated; answers are discarded. If the template was deleted after start, scoring still completes (template stats skipped).',
      operationId: 'submitMockTest',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['answers'],
              properties: {
                timeTaken: {
                  type: 'integer',
                  description: 'Minutes taken. Defaults to the template totalTime if omitted.',
                  example: 67,
                },
                answers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['questionId', 'questionType', 'module'],
                    properties: {
                      questionId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
                      questionType: { type: 'string', example: 'mcq_single' },
                      module: { type: 'string', enum: MODULE_ENUM, example: 'reading' },
                      answer: {
                        description:
                          'Raw answer for non-speaking questions (string, string[], or number[]). null/omitted for speaking.',
                        nullable: true,
                      },
                      score: {
                        type: 'number',
                        nullable: true,
                        description: 'Pre-scored value (0–100) for speaking questions only; null when skipped.',
                        example: null,
                      },
                    },
                  },
                },
              },
            },
            example: {
              timeTaken: 67,
              answers: [
                { questionId: 'abc123', questionType: 'read_aloud', module: 'speaking', answer: null, score: 72.4 },
                { questionId: 'def456', questionType: 'write_essay', module: 'writing', answer: 'The essay text...', score: null },
                { questionId: 'ghi789', questionType: 'mcq_single', module: 'reading', answer: 'B', score: null },
                { questionId: 'jkl012', questionType: 'write_dictation', module: 'listening', answer: 'The scientists discovered a new species', score: null },
              ],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Full scored result.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Mock test submitted successfully.' },
                  data: { $ref: '#/components/schemas/MockTestResult' },
                },
              },
            },
          },
        },
        400: validationError('answers must be an array.'),
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
};
