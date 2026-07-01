/** OpenAPI tags, schemas and paths for the Listening module. */

export const listeningTags = [
  {
    name: 'Listening Management',
    description:
      'Admin-only CRUD for listening questions (8 types). Audio is uploaded to Cloudinary (resource_type video) and deleted when the question is removed.',
  },
  {
    name: 'Listening',
    description:
      'Student listening practice — fetch questions (audioUrl + playLimit, correct answers stripped) and submit answers to a single evaluate endpoint for rule-based scoring. Correct answers are revealed only in the score response.',
  },
];

export const listeningSchemas = {
  ListeningQuestionStudent: {
    type: 'object',
    description:
      'Student-facing listening question. Always includes audioUrl + playLimit. Correct answers are ALWAYS stripped: options omit isCorrect, blanks omit correctWord, incorrectWordIndices and correctSentence are never sent.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: [
          'summarise_spoken',
          'mcq_multiple',
          'fill_blanks',
          'highlight_summary',
          'mcq_single',
          'select_missing',
          'highlight_incorrect',
          'write_dictation',
        ],
      },
      audioUrl: {
        type: 'string',
        example: 'https://res.cloudinary.com/demo/video/upload/ptepath/listening/audio/abc123.mp3',
      },
      playLimit: {
        type: 'integer',
        enum: [0, 1],
        description: '1 = play once (default), 0 = unlimited replays.',
        example: 1,
      },
      question: {
        type: 'string',
        nullable: true,
        description: 'MCQ types only.',
        example: 'What is the speaker mainly discussing?',
      },
      options: {
        type: 'array',
        description: 'MCQ + summary + select-missing types only — no isCorrect field.',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', example: 'A' },
            text: { type: 'string', example: 'Global population trends' },
          },
        },
      },
      transcript: {
        type: 'string',
        nullable: true,
        description: 'fill_blanks (with [BLANK] markers) and highlight_incorrect only.',
        example: 'The [BLANK] has increased significantly due to [BLANK] factors.',
      },
      blanks: {
        type: 'array',
        description: 'fill_blanks only — positions only, no correctWord.',
        items: {
          type: 'object',
          properties: { position: { type: 'integer', example: 1 } },
        },
      },
    },
  },
  ListeningQuestionListItem: {
    type: 'object',
    description: 'Lightweight list item for the student question-picker — no answers leaked.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: [
          'summarise_spoken',
          'mcq_multiple',
          'fill_blanks',
          'highlight_summary',
          'mcq_single',
          'select_missing',
          'highlight_incorrect',
          'write_dictation',
        ],
      },
      audioUrl: { type: 'string' },
      playLimit: { type: 'integer', enum: [0, 1], example: 1 },
      preview: {
        type: 'string',
        nullable: true,
        example: 'What is the speaker mainly discussing...',
      },
    },
  },
  ListeningQuestionAdmin: {
    type: 'object',
    description:
      'Admin-facing listening question — full document including correct answers and stats (audioPublicId stays internal).',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: [
          'summarise_spoken',
          'mcq_multiple',
          'fill_blanks',
          'highlight_summary',
          'mcq_single',
          'select_missing',
          'highlight_incorrect',
          'write_dictation',
        ],
      },
      audioUrl: { type: 'string' },
      playLimit: { type: 'integer', enum: [0, 1], example: 1 },
      question: { type: 'string', nullable: true },
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
      transcript: { type: 'string', nullable: true },
      blanks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            position: { type: 'integer' },
            correctWord: { type: 'string' },
          },
        },
      },
      incorrectWordIndices: {
        type: 'array',
        items: { type: 'integer' },
        example: [1, 5],
      },
      correctSentence: {
        type: 'string',
        nullable: true,
        example: 'The scientists discovered a new species last year',
      },
      isActive: { type: 'boolean', example: true },
      attemptCount: { type: 'integer', example: 5 },
      avgScore: { type: 'number', format: 'float', example: 62.4 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  ListeningScore: {
    type: 'object',
    description:
      'Rule-based listening score. The `breakdown` shape varies by question type and reveals the correct answers (only here, after submission). displayScore is on the PTE scale (out of 90).',
    properties: {
      questionType: {
        type: 'string',
        enum: [
          'summarise_spoken',
          'mcq_multiple',
          'fill_blanks',
          'highlight_summary',
          'mcq_single',
          'select_missing',
          'highlight_incorrect',
          'write_dictation',
        ],
      },
      finalScore: { type: 'number', format: 'float', example: 88.9 },
      displayScore: { type: 'string', example: '80 / 90' },
      feedback: { type: 'string', example: 'Excellent listening accuracy!' },
      breakdown: {
        type: 'object',
        description:
          'Type-specific result. summarise_spoken: { score, wordCount, wordCountScore, spellingScore, spellingResult, misspelledWords }. mcq_multiple: { score, totalPoints, numberOfCorrect, optionResults[] }. fill_blanks: { score, totalPoints, totalBlanks, breakdown[] }. mcq_single/highlight_summary/select_missing: { score, isCorrect, studentAnswer, correctAnswer, correctAnswerText, optionResults[] }. highlight_incorrect: { score, totalPoints, totalIncorrect, wordResults[] }. write_dictation: { score, wordMatchScore, spellingScore, matchedWords, exactMatches, totalWords, correctSentence, breakdown[] }.',
        additionalProperties: true,
        example: {
          score: 88.9,
          wordMatchScore: 100,
          spellingScore: 62.5,
          matchedWords: 8,
          exactMatches: 5,
          totalWords: 8,
          correctSentence: 'The scientists discovered a new species last year',
          breakdown: [
            {
              correctWord: 'The',
              studentWord: 'The',
              distance: 0,
              result: 'exact',
            },
            {
              correctWord: 'scientists',
              studentWord: 'sientists',
              distance: 1,
              result: 'close',
            },
          ],
        },
      },
    },
  },
};

export const listeningPaths = {
  '/admin/listening/questions': {
    post: {
      tags: ['Listening Management'],
      summary: 'Add a listening question',
      description:
        'Creates a listening question. An audio file is REQUIRED for every type (multipart/form-data, field name `audio`). Array/object fields (`options`, `blanks`, `incorrectWordIndices`) are sent as JSON strings. Required fields depend on `type`: mcq_multiple → question + options[] (≥2, ≥1 correct); mcq_single → question + options[] (≥2, exactly 1 correct); highlight_summary / select_missing → options[] (≥2, exactly 1 correct); fill_blanks → transcript + blanks[]; highlight_incorrect → transcript + incorrectWordIndices[]; write_dictation → correctSentence; summarise_spoken → audio only.',
      operationId: 'addListeningQuestion',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['type', 'audio'],
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'summarise_spoken',
                    'mcq_multiple',
                    'fill_blanks',
                    'highlight_summary',
                    'mcq_single',
                    'select_missing',
                    'highlight_incorrect',
                    'write_dictation',
                  ],
                },
                audio: {
                  type: 'string',
                  format: 'binary',
                  description:
                    'Audio file (MP3/WAV/M4A). Stored on Cloudinary as resource_type video.',
                },
                playLimit: {
                  type: 'integer',
                  enum: [0, 1],
                  description: '1 = play once (default), 0 = unlimited.',
                  example: 1,
                },
                question: { type: 'string', description: 'MCQ types only.' },
                options: {
                  type: 'string',
                  description: 'JSON string: [{ "label", "text", "isCorrect" }].',
                },
                transcript: {
                  type: 'string',
                  description: 'fill_blanks and highlight_incorrect only.',
                },
                blanks: {
                  type: 'string',
                  description: 'JSON string: [{ "position", "correctWord" }] — fill_blanks only.',
                },
                incorrectWordIndices: {
                  type: 'string',
                  description: 'JSON string: [1, 5] — highlight_incorrect only.',
                },
                correctSentence: {
                  type: 'string',
                  description: 'write_dictation only.',
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
                        $ref: '#/components/schemas/ListeningQuestionAdmin',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error or missing audio.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'An audio file is required.',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
    get: {
      tags: ['Listening Management'],
      summary: 'List listening questions',
      description:
        'Returns all listening questions sorted newest first. Optional `type` query filter.',
      operationId: 'listListeningQuestions',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'summarise_spoken',
              'mcq_multiple',
              'fill_blanks',
              'highlight_summary',
              'mcq_single',
              'select_missing',
              'highlight_incorrect',
              'write_dictation',
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
                          $ref: '#/components/schemas/ListeningQuestionAdmin',
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
  '/admin/listening/questions/{id}': {
    get: {
      tags: ['Listening Management'],
      summary: 'Get one listening question',
      operationId: 'getListeningQuestion',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Question.',
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
                        $ref: '#/components/schemas/ListeningQuestionAdmin',
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
      tags: ['Listening Management'],
      summary: 'Update a listening question',
      description:
        'Updates a listening question. `type` is immutable. Send a new `audio` file to replace the existing one (the old Cloudinary asset is deleted). Per-type invariants are re-validated against the existing type.',
      operationId: 'updateListeningQuestion',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: false,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                audio: {
                  type: 'string',
                  format: 'binary',
                  description: 'Optional replacement audio file.',
                },
                playLimit: { type: 'integer', enum: [0, 1] },
                question: { type: 'string' },
                options: { type: 'string', description: 'JSON string.' },
                transcript: { type: 'string' },
                blanks: { type: 'string', description: 'JSON string.' },
                incorrectWordIndices: {
                  type: 'string',
                  description: 'JSON string.',
                },
                correctSentence: { type: 'string' },
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
                        $ref: '#/components/schemas/ListeningQuestionAdmin',
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
      tags: ['Listening Management'],
      summary: 'Delete a listening question',
      description:
        'Deletes the question and its audio asset from Cloudinary (resource_type video).',
      operationId: 'deleteListeningQuestion',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
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
  '/admin/listening/questions/{id}/status': {
    patch: {
      tags: ['Listening Management'],
      summary: 'Toggle listening question active status',
      operationId: 'toggleListeningStatus',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
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
                        $ref: '#/components/schemas/ListeningQuestionAdmin',
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

  // ─── Listening (student) ──────────────────────────────────────
  '/listening/questions/{type}': {
    get: {
      tags: ['Listening'],
      summary: 'List active questions of a type',
      description:
        'Returns active listening questions of the given type for the question-picker. No correct answers leaked.',
      operationId: 'listListeningQuestionsByType',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'summarise_spoken',
              'mcq_multiple',
              'fill_blanks',
              'highlight_summary',
              'mcq_single',
              'select_missing',
              'highlight_incorrect',
              'write_dictation',
            ],
          },
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
                          $ref: '#/components/schemas/ListeningQuestionListItem',
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
        400: {
          description: 'Invalid question type.',
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
  '/listening/{type}/random': {
    get: {
      tags: ['Listening'],
      summary: 'Get a random question of a type',
      description:
        'Returns a random active question of the given type, with correct answers stripped.',
      operationId: 'getRandomListeningQuestion',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'summarise_spoken',
              'mcq_multiple',
              'fill_blanks',
              'highlight_summary',
              'mcq_single',
              'select_missing',
              'highlight_incorrect',
              'write_dictation',
            ],
          },
        },
      ],
      responses: {
        200: {
          description: 'A random question.',
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
                        $ref: '#/components/schemas/ListeningQuestionStudent',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid question type.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Invalid question type.' },
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
  '/listening/{type}/{id}': {
    get: {
      tags: ['Listening'],
      summary: 'Get one question by type and id',
      description:
        'Returns one active question, with correct answers stripped. Includes audioUrl + playLimit.',
      operationId: 'getListeningQuestionStudent',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'summarise_spoken',
              'mcq_multiple',
              'fill_blanks',
              'highlight_summary',
              'mcq_single',
              'select_missing',
              'highlight_incorrect',
              'write_dictation',
            ],
          },
        },
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
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
                        $ref: '#/components/schemas/ListeningQuestionStudent',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid question type or id.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Invalid question type.' },
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
  '/listening/evaluate': {
    post: {
      tags: ['Listening'],
      summary: 'Evaluate a listening answer (all 8 types)',
      description:
        'Single evaluate endpoint routed by `questionType`. Send the answer as `answer` (or `answers`). Format per type: summarise_spoken / write_dictation → string; mcq_single / highlight_summary / select_missing → label string; mcq_multiple → label array; fill_blanks → word array; highlight_incorrect → number array of clicked word indices. Correct answers are revealed in the response.',
      operationId: 'evaluateListening',
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
                    'summarise_spoken',
                    'mcq_multiple',
                    'fill_blanks',
                    'highlight_summary',
                    'mcq_single',
                    'select_missing',
                    'highlight_incorrect',
                    'write_dictation',
                  ],
                },
                answer: {
                  oneOf: [
                    { type: 'string' },
                    {
                      type: 'array',
                      items: {
                        oneOf: [{ type: 'string' }, { type: 'number' }],
                      },
                    },
                  ],
                  description: 'The student answer; shape depends on questionType.',
                },
                answers: {
                  oneOf: [
                    { type: 'string' },
                    {
                      type: 'array',
                      items: {
                        oneOf: [{ type: 'string' }, { type: 'number' }],
                      },
                    },
                  ],
                  description: 'Alias for `answer`.',
                },
              },
            },
            examples: {
              writeDictation: {
                summary: 'Write from dictation',
                value: {
                  questionId: '64f1a2b3c4d5e6f7a8b9c0d1',
                  questionType: 'write_dictation',
                  answer: 'The sientists discoverd a new spesies last year',
                },
              },
              fillBlanks: {
                summary: 'Fill in the blanks',
                value: {
                  questionId: '64f1a2b3c4d5e6f7a8b9c0d1',
                  questionType: 'fill_blanks',
                  answer: ['population', 'economic'],
                },
              },
              mcqMultiple: {
                summary: 'MCQ multiple',
                value: {
                  questionId: '64f1a2b3c4d5e6f7a8b9c0d1',
                  questionType: 'mcq_multiple',
                  answer: ['A', 'C'],
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
              highlightIncorrect: {
                summary: 'Highlight incorrect words',
                value: {
                  questionId: '64f1a2b3c4d5e6f7a8b9c0d1',
                  questionType: 'highlight_incorrect',
                  answer: [1, 5, 9],
                },
              },
              summariseSpoken: {
                summary: 'Summarise spoken text',
                value: {
                  questionId: '64f1a2b3c4d5e6f7a8b9c0d1',
                  questionType: 'summarise_spoken',
                  answer:
                    'The lecture explained how rising populations drive economic change across regions.',
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
                  data: { $ref: '#/components/schemas/ListeningScore' },
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
              example: { success: false, message: 'answer is required.' },
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
