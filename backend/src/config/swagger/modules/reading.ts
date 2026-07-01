/** OpenAPI tags, schemas and paths for the Reading module. */

export const readingTags = [
  {
    name: 'Reading Management',
    description:
      'Admin-only CRUD for reading questions (5 types: R&W fill blanks, MCQ multiple, reorder paragraphs, reading fill blanks, MCQ single).',
  },
  {
    name: 'Reading',
    description:
      'Student reading practice — fetch questions (correct answers stripped) and submit answers to a single evaluate endpoint for rule-based scoring. Correct answers are revealed only in the score response.',
  },
];

export const readingSchemas = {
  ReadingQuestionStudent: {
    type: 'object',
    description:
      'Student-facing reading question. Correct answers are ALWAYS stripped: MCQ options omit isCorrect, blanks omit correctAnswer, reorder paragraphs are shuffled out of order.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: [
          'rw_fill_blanks',
          'mcq_multiple',
          'reorder_paragraphs',
          'reading_fill_blanks',
          'mcq_single',
        ],
      },
      passage: {
        type: 'string',
        example: 'The [BLANK] of climate change has become a [BLANK] concern.',
      },
      question: {
        type: 'string',
        nullable: true,
        example: 'What is the main idea of the passage?',
      },
      options: {
        type: 'array',
        description: 'MCQ types only — no isCorrect field.',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', example: 'A' },
            text: { type: 'string', example: 'Deforestation' },
          },
        },
      },
      blanks: {
        type: 'array',
        description: 'Fill-blank types only — no correctAnswer field.',
        items: {
          type: 'object',
          properties: {
            position: { type: 'integer', example: 0 },
            options: {
              type: 'array',
              items: { type: 'string' },
              example: ['impact', 'affect'],
            },
          },
        },
      },
      wordPool: {
        type: 'array',
        description: 'rw_fill_blanks only (shuffled).',
        items: { type: 'string' },
        example: ['impact', 'affect', 'serious', 'minor'],
      },
      paragraphs: {
        type: 'array',
        description:
          'reorder_paragraphs only — shuffled out of correct order. Labels are omitted to prevent students from inferring the correct sequence.',
        items: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              example: 'Finally, the water flows back to the ocean, completing the cycle.',
            },
          },
        },
      },
    },
  },
  ReadingQuestionListItem: {
    type: 'object',
    description: 'Lightweight list item for the student question-picker — no answers leaked.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: [
          'rw_fill_blanks',
          'mcq_multiple',
          'reorder_paragraphs',
          'reading_fill_blanks',
          'mcq_single',
        ],
      },
      preview: {
        type: 'string',
        nullable: true,
        example: 'What is the main idea of the passage about climate change...',
      },
    },
  },
  ReadingQuestionAdmin: {
    type: 'object',
    description:
      'Admin-facing reading question — full document including correct answers and stats.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: [
          'rw_fill_blanks',
          'mcq_multiple',
          'reorder_paragraphs',
          'reading_fill_blanks',
          'mcq_single',
        ],
      },
      passage: { type: 'string' },
      question: { type: 'string', nullable: true },
      blanks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            position: { type: 'integer' },
            correctAnswer: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            text: { type: 'string' },
            isCorrect: { type: 'boolean' },
          },
        },
      },
      paragraphs: {
        type: 'array',
        items: {
          type: 'object',
          properties: { label: { type: 'string' }, text: { type: 'string' } },
        },
      },
      wordPool: { type: 'array', items: { type: 'string' } },
      isActive: { type: 'boolean', example: true },
      attemptCount: { type: 'integer', example: 5 },
      avgScore: { type: 'number', format: 'float', example: 62.4 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  ReadingScore: {
    type: 'object',
    description:
      'Rule-based reading score. The `breakdown` shape varies by question type and reveals the correct answers (only here, after submission). displayScore is on the PTE scale (out of 90).',
    properties: {
      questionType: {
        type: 'string',
        enum: [
          'rw_fill_blanks',
          'mcq_multiple',
          'reorder_paragraphs',
          'reading_fill_blanks',
          'mcq_single',
        ],
      },
      finalScore: { type: 'number', format: 'float', example: 33.3 },
      displayScore: { type: 'string', example: '30 / 90' },
      feedback: {
        type: 'string',
        example: 'Good attempt. Review the incorrect answers carefully.',
      },
      breakdown: {
        type: 'object',
        description:
          'Type-specific result. Fill: { score, correctCount, totalBlanks, breakdown[] }. MCQ multiple: { score, totalPoints, numberOfCorrect, optionResults[] }. Reorder: { score, correctPairs, totalPairs, studentSequence, correctSequence }. MCQ single: { score, isCorrect, studentAnswer, correctAnswer, correctAnswerText, optionResults[] }.',
        additionalProperties: true,
        example: {
          score: 33.3,
          totalPoints: 1,
          numberOfCorrect: 3,
          optionResults: [
            {
              label: 'A',
              text: 'Deforestation',
              selected: true,
              isCorrect: true,
              result: 'correct_selected',
            },
            {
              label: 'B',
              text: 'Solar activity',
              selected: true,
              isCorrect: false,
              result: 'wrong_selected',
            },
            {
              label: 'C',
              text: 'Industrial emissions',
              selected: false,
              isCorrect: true,
              result: 'missed',
            },
          ],
        },
      },
    },
  },
};

export const readingPaths = {
  '/admin/reading/questions': {
    post: {
      tags: ['Reading Management'],
      summary: 'Add a reading question',
      description:
        'Creates a reading question. Required nested fields depend on `type`: MCQ types need `question` + `options[]` (mcq_single: exactly 1 correct; mcq_multiple: ≥1 correct); fill types need `blanks[]` (rw_fill_blanks also needs `wordPool[]`); reorder needs `paragraphs[]` (≥3, in correct order).',
      operationId: 'addReadingQuestion',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'passage'],
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'rw_fill_blanks',
                    'mcq_multiple',
                    'reorder_paragraphs',
                    'reading_fill_blanks',
                    'mcq_single',
                  ],
                },
                passage: { type: 'string' },
                question: { type: 'string', description: 'MCQ types only.' },
                blanks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      position: { type: 'integer' },
                      correctAnswer: { type: 'string' },
                      options: { type: 'array', items: { type: 'string' } },
                    },
                  },
                  description: 'Fill-blank types.',
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      text: { type: 'string' },
                      isCorrect: { type: 'boolean' },
                    },
                  },
                  description: 'MCQ types.',
                },
                paragraphs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      text: { type: 'string' },
                    },
                  },
                  description: 'Reorder type (correct order).',
                },
                wordPool: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'rw_fill_blanks only.',
                },
              },
            },
            examples: {
              mcqSingle: {
                summary: 'MCQ single',
                value: {
                  type: 'mcq_single',
                  passage: 'Automation is reshaping work...',
                  question: 'What is the main idea?',
                  options: [
                    {
                      label: 'A',
                      text: 'Tech improves productivity',
                      isCorrect: false,
                    },
                    {
                      label: 'B',
                      text: 'Automation causes unemployment',
                      isCorrect: true,
                    },
                  ],
                },
              },
              mcqMultiple: {
                summary: 'MCQ multiple',
                value: {
                  type: 'mcq_multiple',
                  passage:
                    'Photosynthesis converts light energy into chemical energy stored as glucose. The process takes place in the chloroplasts and releases oxygen as a by-product.',
                  question: 'Which of the following statements about photosynthesis are correct?',
                  options: [
                    {
                      label: 'A',
                      text: 'Photosynthesis converts light energy into chemical energy.',
                      isCorrect: true,
                    },
                    {
                      label: 'B',
                      text: 'The process occurs in the mitochondria.',
                      isCorrect: false,
                    },
                    {
                      label: 'C',
                      text: 'Oxygen is released as a by-product.',
                      isCorrect: true,
                    },
                    {
                      label: 'D',
                      text: 'Only bacteria can perform photosynthesis.',
                      isCorrect: false,
                    },
                  ],
                },
              },
              rwFill: {
                summary: 'R&W fill blanks',
                value: {
                  type: 'rw_fill_blanks',
                  passage: 'The [1] of climate change is a [2] concern for scientists worldwide.',
                  wordPool: ['impact', 'affect', 'serious', 'minor'],
                  blanks: [
                    {
                      position: 1,
                      correctAnswer: 'impact',
                      options: ['impact', 'affect'],
                    },
                    {
                      position: 2,
                      correctAnswer: 'serious',
                      options: ['serious', 'minor'],
                    },
                  ],
                },
              },
              readingFill: {
                summary: 'Reading fill blanks',
                value: {
                  type: 'reading_fill_blanks',
                  passage:
                    'The Industrial Revolution [1] the way goods were produced. Factories [2] cottage industries, and oxygen was released as a by-product.',
                  blanks: [
                    {
                      position: 1,
                      correctAnswer: 'transformed',
                      options: ['transformed', 'ignored', 'delayed'],
                    },
                    {
                      position: 2,
                      correctAnswer: 'replaced',
                      options: ['replaced', 'duplicated', 'celebrated'],
                    },
                  ],
                },
              },
              reorder: {
                summary: 'Reorder paragraphs',
                value: {
                  type: 'reorder_paragraphs',
                  passage: 'Arrange the paragraphs about the water cycle in the correct order.',
                  paragraphs: [
                    {
                      label: 'A',
                      text: 'Water vapour condenses in the upper atmosphere to form clouds.',
                    },
                    {
                      label: 'B',
                      text: 'Water falls back to Earth as precipitation when droplets accumulate.',
                    },
                    {
                      label: 'C',
                      text: 'Heat from the sun causes water to evaporate from oceans and rivers.',
                    },
                    {
                      label: 'D',
                      text: 'Water flows back to the ocean or soaks into the soil, completing the cycle.',
                    },
                  ],
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
                        $ref: '#/components/schemas/ReadingQuestionAdmin',
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
                message: 'Exactly one option must be marked correct.',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
    get: {
      tags: ['Reading Management'],
      summary: 'List reading questions',
      description:
        'Returns all reading questions sorted newest first. Optional `type` query filter.',
      operationId: 'listReadingQuestions',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'rw_fill_blanks',
              'mcq_multiple',
              'reorder_paragraphs',
              'reading_fill_blanks',
              'mcq_single',
            ],
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
                          $ref: '#/components/schemas/ReadingQuestionAdmin',
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
  '/admin/reading/questions/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Reading question ID.',
      },
    ],
    get: {
      tags: ['Reading Management'],
      summary: 'Get one reading question',
      operationId: 'getReadingQuestion',
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
                        $ref: '#/components/schemas/ReadingQuestionAdmin',
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
      tags: ['Reading Management'],
      summary: 'Update a reading question',
      description:
        'Updates the provided fields only. `type` is immutable. Updated content is re-validated against the existing type.',
      operationId: 'updateReadingQuestion',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                passage: { type: 'string' },
                question: { type: 'string' },
                blanks: { type: 'array', items: { type: 'object' } },
                options: { type: 'array', items: { type: 'object' } },
                paragraphs: { type: 'array', items: { type: 'object' } },
                wordPool: { type: 'array', items: { type: 'string' } },
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
                        $ref: '#/components/schemas/ReadingQuestionAdmin',
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
                message: 'At least one field must be provided to update.',
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
      tags: ['Reading Management'],
      summary: 'Delete a reading question',
      operationId: 'deleteReadingQuestion',
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
  '/admin/reading/questions/{id}/status': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Reading question ID.',
      },
    ],
    patch: {
      tags: ['Reading Management'],
      summary: 'Toggle question active status',
      description: 'Sets `isActive` to the provided boolean.',
      operationId: 'toggleReadingQuestionStatus',
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
                        $ref: '#/components/schemas/ReadingQuestionAdmin',
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
  // ─── Reading (student) ────────────────────────────────────────
  '/reading/questions/{type}': {
    get: {
      tags: ['Reading'],
      summary: 'List active questions of a type',
      description:
        'Returns all active questions of the given type for the student question-picker (no answers leaked).',
      operationId: 'listReadingQuestionsByType',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'rw_fill_blanks',
              'mcq_multiple',
              'reorder_paragraphs',
              'reading_fill_blanks',
              'mcq_single',
            ],
          },
          description: 'Question type.',
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
                          $ref: '#/components/schemas/ReadingQuestionListItem',
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
  '/reading/{type}/random': {
    get: {
      tags: ['Reading'],
      summary: 'Get a random question of a type',
      description:
        'Returns one random active question of the given type, with correct answers stripped.',
      operationId: 'getRandomReadingQuestion',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'rw_fill_blanks',
              'mcq_multiple',
              'reorder_paragraphs',
              'reading_fill_blanks',
              'mcq_single',
            ],
          },
          description: 'Question type.',
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
                        $ref: '#/components/schemas/ReadingQuestionStudent',
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
  '/reading/{type}/{id}': {
    get: {
      tags: ['Reading'],
      summary: 'Get a question by type and id',
      description:
        'Returns one active reading question with correct answers stripped (MCQ options omit isCorrect, blanks omit correctAnswer, reorder paragraphs shuffled).',
      operationId: 'getReadingQuestionStudent',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'rw_fill_blanks',
              'mcq_multiple',
              'reorder_paragraphs',
              'reading_fill_blanks',
              'mcq_single',
            ],
          },
          description: 'Question type.',
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Reading question ID.',
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
                        $ref: '#/components/schemas/ReadingQuestionStudent',
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
  '/reading/evaluate': {
    post: {
      tags: ['Reading'],
      summary: 'Evaluate a reading answer (all 5 types)',
      description:
        'Single endpoint for all reading types — routed by `questionType`. Send `answers` (array) for fill/reorder/mcq_multiple; mcq_single may send `answer` (string) or `answers`. The score response reveals the correct answers. Student answers are discarded after scoring.',
      operationId: 'evaluateReading',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['questionId', 'questionType'],
              properties: {
                questionId: {
                  type: 'string',
                  example: '64f1a2b3c4d5e6f7a8b9c0d1',
                },
                questionType: {
                  type: 'string',
                  enum: [
                    'rw_fill_blanks',
                    'mcq_multiple',
                    'reorder_paragraphs',
                    'reading_fill_blanks',
                    'mcq_single',
                  ],
                },
                answers: {
                  oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'string' }],
                  description: 'Array of answers; or a single string for mcq_single.',
                },
                answer: {
                  type: 'string',
                  description: 'mcq_single alternative (single label).',
                },
              },
            },
            examples: {
              mcqMultiple: {
                summary: 'MCQ multiple',
                value: {
                  questionId: '64f1a2b3c4d5e6f7a8b9c0d1',
                  questionType: 'mcq_multiple',
                  answers: ['A', 'C'],
                },
              },
              mcqSingle: {
                summary: 'MCQ single',
                value: {
                  questionId: '64f1a2b3c4d5e6f7a8b9c0d1',
                  questionType: 'mcq_single',
                  answer: 'B',
                },
              },
              rwFillBlanks: {
                summary: 'R&W fill blanks',
                value: {
                  questionId: '64f1a2b3c4d5e6f7a8b9c0d1',
                  questionType: 'rw_fill_blanks',
                  answers: ['impact', 'serious'],
                },
              },
              readingFillBlanks: {
                summary: 'Reading fill blanks',
                value: {
                  questionId: '64f1a2b3c4d5e6f7a8b9c0d1',
                  questionType: 'reading_fill_blanks',
                  answers: ['transformed', 'replaced'],
                },
              },
              reorder: {
                summary: 'Reorder paragraphs',
                value: {
                  questionId: '64f1a2b3c4d5e6f7a8b9c0d1',
                  questionType: 'reorder_paragraphs',
                  answers: [
                    'Heat from the sun causes water to evaporate from oceans and rivers.',
                    'Water vapour condenses in the upper atmosphere to form clouds.',
                    'Water falls back to Earth as precipitation when droplets accumulate.',
                    'Water flows back to the ocean or soaks into the soil, completing the cycle.',
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Score result (correct answers revealed).',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Answer evaluated successfully.',
                  },
                  data: { $ref: '#/components/schemas/ReadingScore' },
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
              example: { success: false, message: 'answers is required.' },
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
