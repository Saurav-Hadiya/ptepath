/** OpenAPI tags, schemas and paths for the Writing module. */

export const writingTags = [
  {
    name: 'Writing Management',
    description: 'Admin-only CRUD for writing questions (Summarise Written Text, Write Essay).',
  },
  {
    name: 'Writing',
    description:
      'Student writing practice — fetch questions and submit text for rule-based scoring (word count + spelling). Response text is discarded immediately after scoring.',
  },
];

export const writingSchemas = {
  WritingQuestionStudent: {
    type: 'object',
    description: 'Student-facing writing question view.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: ['summarise_written_text', 'write_essay'],
        example: 'summarise_written_text',
      },
      content: {
        type: 'string',
        description: 'Passage text (SWT) or essay prompt (WE).',
        example: 'The Industrial Revolution transformed manufacturing...',
      },
      timeLimit: { type: 'integer', description: 'Seconds.', example: 600 },
      wordMin: { type: 'integer', example: 5 },
      wordMax: { type: 'integer', example: 75 },
    },
  },
  WritingQuestionListItem: {
    type: 'object',
    description: 'Lightweight list item for the student question-picker.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: { type: 'string', enum: ['summarise_written_text', 'write_essay'] },
      preview: {
        type: 'string',
        nullable: true,
        example: 'The Industrial Revolution transformed manufacturing across Europe...',
      },
      timeLimit: { type: 'integer', example: 600 },
      wordMin: { type: 'integer', example: 5 },
      wordMax: { type: 'integer', example: 75 },
    },
  },
  WritingQuestionAdmin: {
    type: 'object',
    description: 'Admin-facing writing question view including stats.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: ['summarise_written_text', 'write_essay'],
        example: 'write_essay',
      },
      content: {
        type: 'string',
        example: 'Some people think technology makes life more complex. Discuss.',
      },
      timeLimit: { type: 'integer', example: 1200 },
      wordMin: { type: 'integer', example: 200 },
      wordMax: { type: 'integer', example: 300 },
      isActive: { type: 'boolean', example: true },
      attemptCount: { type: 'integer', example: 8 },
      avgScore: { type: 'number', format: 'float', example: 71.5 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  WritingScore: {
    type: 'object',
    description:
      'Rule-based writing score. Word count (50%) + spelling (50%). displayScore is on the PTE scale (out of 90).',
    properties: {
      wordCount: { type: 'integer', example: 52 },
      wordCountScore: { type: 'number', example: 100 },
      spellingScore: { type: 'number', format: 'float', example: 87.3 },
      finalScore: { type: 'number', format: 'float', example: 93.7 },
      displayScore: { type: 'string', example: '84 / 90' },
      feedback: {
        type: 'string',
        example: 'Some spelling errors detected. Proofread before submitting.',
      },
      misspelledWords: {
        type: 'array',
        items: { type: 'string' },
        example: ['goverment', 'enviromental'],
      },
      breakdown: {
        type: 'object',
        properties: {
          wordCount: {
            type: 'object',
            properties: {
              score: { type: 'number', example: 100 },
              actual: { type: 'integer', example: 52 },
              min: { type: 'integer', example: 5 },
              max: { type: 'integer', example: 75 },
            },
          },
          spelling: {
            type: 'object',
            properties: {
              score: { type: 'number', format: 'float', example: 87.3 },
              correct: { type: 'integer', example: 47 },
              incorrect: { type: 'integer', example: 7 },
              total: { type: 'integer', example: 54 },
            },
          },
        },
      },
    },
  },
};

export const writingPaths = {
  '/admin/writing/questions': {
    post: {
      tags: ['Writing Management'],
      summary: 'Add a writing question',
      description:
        'Creates a writing question. `wordMin`, `wordMax` and the default `timeLimit` are derived from `type` (SWT: 5/75/600s, WE: 200/300/1200s). `timeLimit` is optional.',
      operationId: 'addWritingQuestion',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'content'],
              properties: {
                type: {
                  type: 'string',
                  enum: ['summarise_written_text', 'write_essay'],
                },
                content: {
                  type: 'string',
                  description: 'Passage text (SWT) or essay prompt (WE).',
                },
                timeLimit: {
                  type: 'integer',
                  description: 'Seconds. Defaults by type if omitted.',
                  example: 600,
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Question created.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Question created successfully.',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      question: {
                        $ref: '#/components/schemas/WritingQuestionAdmin',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'content is required.' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
    get: {
      tags: ['Writing Management'],
      summary: 'List writing questions',
      description:
        'Returns all writing questions sorted newest first. Optional `type` query filter.',
      operationId: 'listWritingQuestions',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['summarise_written_text', 'write_essay'],
          },
          description: 'Filter by question type.',
        },
      ],
      responses: {
        200: {
          description: 'List of questions.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Questions retrieved successfully.',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      questions: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/WritingQuestionAdmin',
                        },
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
  '/admin/writing/questions/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Writing question ID.',
      },
    ],
    get: {
      tags: ['Writing Management'],
      summary: 'Get one writing question',
      operationId: 'getWritingQuestion',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Question found.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Question retrieved successfully.',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      question: {
                        $ref: '#/components/schemas/WritingQuestionAdmin',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: {
          description: 'Question not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Question not found.' },
            },
          },
        },
      },
    },
    put: {
      tags: ['Writing Management'],
      summary: 'Update a writing question',
      description:
        'Updates `content` and/or `timeLimit` only. `type`, `wordMin` and `wordMax` are immutable.',
      operationId: 'updateWritingQuestion',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                timeLimit: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Question updated.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Question updated successfully.',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      question: {
                        $ref: '#/components/schemas/WritingQuestionAdmin',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'At least one field (content or timeLimit) must be provided to update.',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: {
          description: 'Question not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Question not found.' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Writing Management'],
      summary: 'Delete a writing question',
      operationId: 'deleteWritingQuestion',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Question deleted.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessMessage' },
              example: { success: true, message: 'Question deleted.' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: {
          description: 'Question not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Question not found.' },
            },
          },
        },
      },
    },
  },
  '/admin/writing/questions/{id}/status': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Writing question ID.',
      },
    ],
    patch: {
      tags: ['Writing Management'],
      summary: 'Toggle question active status',
      description: 'Sets `isActive` to the provided boolean.',
      operationId: 'toggleWritingQuestionStatus',
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
                  message: { type: 'string', example: 'Question deactivated.' },
                  data: {
                    type: 'object',
                    properties: {
                      question: {
                        $ref: '#/components/schemas/WritingQuestionAdmin',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'isActive must be a boolean (true or false).',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: {
          description: 'Question not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Question not found.' },
            },
          },
        },
      },
    },
  },
  // ─── Writing (student) ────────────────────────────────────────
  '/writing/questions/{type}': {
    get: {
      tags: ['Writing'],
      summary: 'List active questions of a type',
      description:
        'Returns all active questions of the given type for the student question-picker.',
      operationId: 'listWritingQuestionsByType',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: { type: 'string', enum: ['summarise', 'essay'] },
          description: 'Short question type (summarise | essay).',
        },
      ],
      responses: {
        200: {
          description: 'List of active questions.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Questions retrieved successfully.',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      questions: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/WritingQuestionListItem',
                        },
                      },
                      total: { type: 'integer', example: 3 },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid type.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Invalid question type.' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/writing/{type}/random': {
    get: {
      tags: ['Writing'],
      summary: 'Get a random question of a type',
      description: 'Returns one random active question of the given type.',
      operationId: 'getRandomWritingQuestion',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: { type: 'string', enum: ['summarise', 'essay'] },
          description: 'Short question type (summarise | essay).',
        },
      ],
      responses: {
        200: {
          description: 'A random active question.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Question retrieved successfully.',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      question: {
                        $ref: '#/components/schemas/WritingQuestionStudent',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: {
          description: 'No active questions available.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'No active questions available.',
              },
            },
          },
        },
      },
    },
  },
  '/writing/{type}/{id}': {
    get: {
      tags: ['Writing'],
      summary: 'Get a question by type and id',
      description: 'Returns one active writing question.',
      operationId: 'getWritingQuestionStudent',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: { type: 'string', enum: ['summarise', 'essay'] },
          description: 'Short question type (summarise | essay).',
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Writing question ID.',
        },
      ],
      responses: {
        200: {
          description: 'The question.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Question retrieved successfully.',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      question: {
                        $ref: '#/components/schemas/WritingQuestionStudent',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: {
          description: 'Question not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Question not found.' },
            },
          },
        },
      },
    },
  },
  '/writing/evaluate/summarise': {
    post: {
      tags: ['Writing'],
      summary: 'Evaluate a Summarise Written Text response',
      description:
        'Submit `{ questionId, responseText }` as JSON. The text is scored (word count + spelling) then discarded. Never stored.',
      operationId: 'evaluateSummarise',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['questionId', 'responseText'],
              properties: {
                questionId: {
                  type: 'string',
                  example: '64f1a2b3c4d5e6f7a8b9c0d1',
                },
                responseText: {
                  type: 'string',
                  example:
                    'The passage explains how the Industrial Revolution reshaped manufacturing and society.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Score result.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Response evaluated successfully.',
                  },
                  data: { $ref: '#/components/schemas/WritingScore' },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'responseText cannot be empty.',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: {
          description: 'Question not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Question not found.' },
            },
          },
        },
      },
    },
  },
  '/writing/evaluate/essay': {
    post: {
      tags: ['Writing'],
      summary: 'Evaluate a Write Essay response',
      description:
        'Submit `{ questionId, responseText }` as JSON. The text is scored (word count + spelling) then discarded. Never stored.',
      operationId: 'evaluateEssay',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['questionId', 'responseText'],
              properties: {
                questionId: {
                  type: 'string',
                  example: '64f1a2b3c4d5e6f7a8b9c0d1',
                },
                responseText: {
                  type: 'string',
                  example: 'Technology has undeniably increased the complexity of modern life...',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Score result.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Response evaluated successfully.',
                  },
                  data: { $ref: '#/components/schemas/WritingScore' },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'responseText cannot be empty.',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: {
          description: 'Question not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Question not found.' },
            },
          },
        },
      },
    },
  },
};
