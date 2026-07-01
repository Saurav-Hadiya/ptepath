/** OpenAPI tags, schemas, request bodies and paths for the Speaking module. */

export const speakingTags = [
  {
    name: 'Speaking Management',
    description:
      'Admin-only CRUD for speaking questions. Image upload supported for Describe Image questions.',
  },
  {
    name: 'Speaking',
    description:
      'Student speaking practice — fetch questions and submit audio for rule-based scoring. Audio is discarded immediately after scoring.',
  },
];

export const speakingSchemas = {
  SpeakingQuestionStudent: {
    type: 'object',
    description: 'Student-facing question view. Never includes acceptedAnswers or imagePublicId.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: [
          'read_aloud',
          'repeat_sentence',
          'describe_image',
          'respond_situation',
          'answer_short',
        ],
        example: 'read_aloud',
      },
      content: {
        type: 'string',
        example: 'The quick brown fox jumps over the lazy dog.',
      },
      imageUrl: { type: 'string', nullable: true, example: null },
      speakingTime: { type: 'integer', example: 40 },
      preparationTime: { type: 'integer', example: 30 },
    },
  },
  SpeakingQuestionAdmin: {
    type: 'object',
    description: 'Admin-facing question view including stats and accepted answers.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: [
          'read_aloud',
          'repeat_sentence',
          'describe_image',
          'respond_situation',
          'answer_short',
        ],
        example: 'answer_short',
      },
      content: {
        type: 'string',
        example: 'What do you call a person who designs buildings?',
      },
      imageUrl: { type: 'string', nullable: true, example: null },
      acceptedAnswers: {
        type: 'array',
        items: { type: 'string' },
        example: ['architect', 'building designer'],
      },
      speakingTime: { type: 'integer', example: 10 },
      preparationTime: { type: 'integer', example: 0 },
      isActive: { type: 'boolean', example: true },
      attemptCount: { type: 'integer', example: 12 },
      avgScore: { type: 'number', format: 'float', example: 74.3 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  SpeakingQuestionListItem: {
    type: 'object',
    description:
      'Lightweight list item for the student question-picker. preview is null for repeat_sentence (the sentence must not be revealed before recording).',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      type: {
        type: 'string',
        enum: [
          'read_aloud',
          'repeat_sentence',
          'describe_image',
          'respond_situation',
          'answer_short',
        ],
      },
      preview: {
        type: 'string',
        nullable: true,
        example: 'The quick brown fox jumps over the lazy dog near the river.',
      },
      imageUrl: { type: 'string', nullable: true, example: null },
      speakingTime: { type: 'integer', example: 40 },
      preparationTime: { type: 'integer', example: 30 },
    },
  },
  SpeakingScore: {
    type: 'object',
    description:
      'Rule-based score result. Open-ended types have null content; short answers have null fluency. displayScore is on the PTE scale (out of 90).',
    properties: {
      contentScore: { type: 'integer', nullable: true, example: 78 },
      fluencyScore: { type: 'integer', nullable: true, example: 85 },
      pronunciationScore: { type: 'integer', nullable: true, example: 70 },
      engagementScore: { type: 'integer', nullable: true, example: null },
      finalScore: { type: 'number', format: 'float', example: 79.6 },
      displayScore: { type: 'string', example: '72 / 90' },
      wpm: { type: 'integer', nullable: true, example: 132 },
      feedback: {
        type: 'string',
        example: 'Your pronunciation could be clearer. Focus on enunciating each word distinctly.',
      },
      correctAnswer: {
        type: 'string',
        description: 'answer_short only — the primary accepted answer.',
        example: 'architect',
      },
    },
  },
};

export const speakingRequestBodies = {
  SpeakingAudioWithId: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          required: ['audio', 'questionId'],
          properties: {
            audio: {
              type: 'string',
              format: 'binary',
              description: 'Recorded audio (WebM or MP4).',
            },
            questionId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
          },
        },
      },
    },
  },
  SpeakingAudioWithDuration: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          required: ['audio', 'questionId'],
          properties: {
            audio: {
              type: 'string',
              format: 'binary',
              description: 'Recorded audio (WebM or MP4).',
            },
            questionId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            recordingDuration: {
              type: 'integer',
              description:
                'Actual recording length in seconds. Falls back to the question speakingTime if omitted.',
              example: 38,
            },
          },
        },
      },
    },
  },
};

export const speakingPaths = {
  '/admin/speaking/questions': {
    post: {
      tags: ['Speaking Management'],
      summary: 'Add a speaking question',
      description:
        'Creates a speaking question. For `describe_image`, send `multipart/form-data` with an `image` file (uploaded to Cloudinary). Other types send the same fields without a file. `acceptedAnswers` (answer_short only) may be a JSON array or comma-separated string.',
      operationId: 'addSpeakingQuestion',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['type', 'speakingTime'],
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'read_aloud',
                    'repeat_sentence',
                    'describe_image',
                    'respond_situation',
                    'answer_short',
                  ],
                },
                content: {
                  type: 'string',
                  description: 'Required for all types except describe_image.',
                },
                speakingTime: { type: 'integer', example: 40 },
                preparationTime: { type: 'integer', example: 30 },
                acceptedAnswers: {
                  type: 'string',
                  description:
                    'answer_short only. JSON array or comma-separated, e.g. ["architect","designer"].',
                },
                image: {
                  type: 'string',
                  format: 'binary',
                  description: 'describe_image only — JPG/PNG.',
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
                        $ref: '#/components/schemas/SpeakingQuestionAdmin',
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
                message: 'content is required for this question type.',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
    get: {
      tags: ['Speaking Management'],
      summary: 'List speaking questions',
      description:
        'Returns all speaking questions sorted newest first. Optional `type` query filter.',
      operationId: 'listSpeakingQuestions',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'read_aloud',
              'repeat_sentence',
              'describe_image',
              'respond_situation',
              'answer_short',
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
                  data: {
                    type: 'object',
                    properties: {
                      questions: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/SpeakingQuestionAdmin',
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
  '/admin/speaking/questions/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Speaking question ID.',
      },
    ],
    put: {
      tags: ['Speaking Management'],
      summary: 'Update a speaking question',
      description:
        'Updates provided fields only. For describe_image, sending a new `image` replaces and deletes the old Cloudinary asset.',
      operationId: 'updateSpeakingQuestion',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                speakingTime: { type: 'integer' },
                preparationTime: { type: 'integer' },
                acceptedAnswers: {
                  type: 'string',
                  description: 'answer_short only.',
                },
                image: {
                  type: 'string',
                  format: 'binary',
                  description: 'describe_image only.',
                },
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
                        $ref: '#/components/schemas/SpeakingQuestionAdmin',
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
    delete: {
      tags: ['Speaking Management'],
      summary: 'Delete a speaking question',
      description:
        'Deletes the question. For describe_image, the Cloudinary image is also removed.',
      operationId: 'deleteSpeakingQuestion',
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
  '/admin/speaking/questions/{id}/status': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Speaking question ID.',
      },
    ],
    patch: {
      tags: ['Speaking Management'],
      summary: 'Toggle question active status',
      description: 'Sets `isActive` to the provided boolean (or flips it if omitted).',
      operationId: 'toggleSpeakingQuestionStatus',
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
                        $ref: '#/components/schemas/SpeakingQuestionAdmin',
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
  },
  // ─── Speaking (student) ───────────────────────────────────────
  '/speaking/questions/{type}': {
    get: {
      tags: ['Speaking'],
      summary: 'List active questions of a type',
      description:
        'Returns all active questions of the given type for the student question-picker. Never includes acceptedAnswers or imagePublicId; repeat_sentence previews are withheld.',
      operationId: 'listSpeakingQuestionsByType',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'read-aloud',
              'repeat-sentence',
              'describe-image',
              'respond-situation',
              'answer-short',
            ],
          },
          description: 'Hyphenated question type.',
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
                  data: {
                    type: 'object',
                    properties: {
                      questions: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/SpeakingQuestionListItem',
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
  '/speaking/question/{type}/random': {
    get: {
      tags: ['Speaking'],
      summary: 'Get a random question of a type',
      description:
        'Returns one random active question of the given type. `acceptedAnswers` and `imagePublicId` are never included.',
      operationId: 'getRandomSpeakingQuestion',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'read-aloud',
              'repeat-sentence',
              'describe-image',
              'respond-situation',
              'answer-short',
            ],
          },
          description: 'Hyphenated question type.',
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
                  data: {
                    type: 'object',
                    properties: {
                      question: {
                        $ref: '#/components/schemas/SpeakingQuestionStudent',
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
  '/speaking/question/{type}/{id}': {
    get: {
      tags: ['Speaking'],
      summary: 'Get a question by type and id',
      description:
        'Returns one active question. `acceptedAnswers` and `imagePublicId` are never included.',
      operationId: 'getSpeakingQuestion',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'read-aloud',
              'repeat-sentence',
              'describe-image',
              'respond-situation',
              'answer-short',
            ],
          },
          description: 'Hyphenated question type.',
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Speaking question ID.',
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
                  data: {
                    type: 'object',
                    properties: {
                      question: {
                        $ref: '#/components/schemas/SpeakingQuestionStudent',
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
  '/speaking/evaluate/read-aloud': {
    post: {
      tags: ['Speaking'],
      summary: 'Evaluate a Read Aloud response',
      description:
        'Submit recorded audio (multipart `audio` field) with `questionId`. Audio is transcribed, scored, then deleted. Never stored.',
      operationId: 'evaluateReadAloud',
      security: [{ bearerAuth: [] }],
      requestBody: { $ref: '#/components/requestBodies/SpeakingAudioWithId' },
      responses: {
        200: {
          description: 'Score result.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/SpeakingScore' },
                },
              },
            },
          },
        },
        400: {
          description: 'Missing audio.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Audio file is required.' },
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
  '/speaking/evaluate/repeat-sentence': {
    post: {
      tags: ['Speaking'],
      summary: 'Evaluate a Repeat Sentence response',
      description:
        'Submit recorded audio (multipart `audio` field) with `questionId`. Audio is discarded after scoring.',
      operationId: 'evaluateRepeatSentence',
      security: [{ bearerAuth: [] }],
      requestBody: { $ref: '#/components/requestBodies/SpeakingAudioWithId' },
      responses: {
        200: {
          description: 'Score result.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/SpeakingScore' },
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
            },
          },
        },
      },
    },
  },
  '/speaking/evaluate/describe-image': {
    post: {
      tags: ['Speaking'],
      summary: 'Evaluate a Describe Image response',
      description:
        'Submit recorded audio (multipart `audio` field) with `questionId` and optional `recordingDuration` (seconds). Audio is discarded after scoring.',
      operationId: 'evaluateDescribeImage',
      security: [{ bearerAuth: [] }],
      requestBody: {
        $ref: '#/components/requestBodies/SpeakingAudioWithDuration',
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
                  data: { $ref: '#/components/schemas/SpeakingScore' },
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
            },
          },
        },
      },
    },
  },
  '/speaking/evaluate/respond-situation': {
    post: {
      tags: ['Speaking'],
      summary: 'Evaluate a Respond to Situation response',
      description:
        'Submit recorded audio (multipart `audio` field) with `questionId` and optional `recordingDuration` (seconds). Audio is discarded after scoring.',
      operationId: 'evaluateRespondSituation',
      security: [{ bearerAuth: [] }],
      requestBody: {
        $ref: '#/components/requestBodies/SpeakingAudioWithDuration',
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
                  data: { $ref: '#/components/schemas/SpeakingScore' },
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
            },
          },
        },
      },
    },
  },
  '/speaking/evaluate/answer-short': {
    post: {
      tags: ['Speaking'],
      summary: 'Evaluate an Answer Short Question response',
      description:
        'Submit recorded audio (multipart `audio` field) with `questionId`. Returns the score and the primary correct answer. Audio is discarded after scoring.',
      operationId: 'evaluateAnswerShort',
      security: [{ bearerAuth: [] }],
      requestBody: { $ref: '#/components/requestBodies/SpeakingAudioWithId' },
      responses: {
        200: {
          description: 'Score result including correctAnswer.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/SpeakingScore' },
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
            },
          },
        },
      },
    },
  },
};
