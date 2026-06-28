import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'PTEPath API',
      version: '1.0.0',
      description: `
**PTEPath** — PTE Academic Exam Practice Platform

Closed platform. Admin creates student accounts. Students practice Speaking, Writing, Reading, and Listening modules and take mock tests.

## Authentication

This API uses a **dual-token JWT strategy**:

| Token | Lifetime | Transport | Usage |
|---|---|---|---|
| Access Token | 15 minutes | \`Authorization: Bearer <token>\` header | All authenticated requests |
| Refresh Token | 7 days | \`httpOnly\` cookie (set automatically) | Silently renew access token via \`POST /api/auth/refresh\` |

### Auth flows
1. **Normal login** → \`POST /api/auth/login\` → receive \`accessToken\` + \`refreshToken\` cookie
2. **First login** → same endpoint → receive \`firstLoginToken\` + \`requiresPasswordChange: true\` → must call \`POST /api/auth/change-password\` before anything else
3. **Token refresh** → \`POST /api/auth/refresh\` (cookie sent automatically by browser) → receive new \`accessToken\`

## Score Format

All scores follow the real PTE Academic scale:
\`\`\`
displayScore = Math.round(finalPercent × 0.90) + " / 90"
\`\`\`
      `,
      contact: {
        name: 'PTEPath Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local development',
      },
      {
        url: 'https://ptepath-api.onrender.com/api',
        description: 'Production (Render)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token from POST /auth/login. Valid for 15 minutes.',
        },
        firstLoginToken: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Short-lived token (10 min) returned on first login. Only valid for POST /auth/change-password.',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description:
            'The 7-day refresh token, set as an httpOnly cookie by POST /auth/login. The browser sends it automatically on same-origin requests — you cannot read or set it from JavaScript. Required by POST /auth/refresh.',
        },
      },
      schemas: {
        // ─── Common ───────────────────────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
          },
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
          },
        },
        UserSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            name: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', example: 'jane.smith@example.com' },
            role: { type: 'string', enum: ['student', 'admin'], example: 'student' },
          },
        },
        // ─── Auth ─────────────────────────────────────────────────────
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'jane.smith@example.com' },
            password: { type: 'string', format: 'password', example: 'MyPass123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            accessToken: { type: 'string', description: 'JWT access token. Store in memory only — never localStorage.' },
            user: { $ref: '#/components/schemas/UserSummary' },
          },
        },
        FirstLoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            requiresPasswordChange: { type: 'boolean', example: true },
            firstLoginToken: { type: 'string', description: 'Short-lived token (10 min). Only valid for POST /auth/change-password.' },
          },
        },
        RefreshResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            accessToken: { type: 'string', description: 'New access token.' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['newPassword', 'confirmPassword'],
          properties: {
            newPassword: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'NewPass123',
              description: 'Minimum 8 characters, at least one number.',
            },
            confirmPassword: { type: 'string', format: 'password', example: 'NewPass123' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'jane.smith@example.com' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['userId', 'token', 'newPassword', 'confirmPassword'],
          properties: {
            userId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1', description: 'From email link query param `id`.' },
            token: { type: 'string', description: 'Raw reset token from email link query param `token`.' },
            newPassword: { type: 'string', format: 'password', minLength: 8, example: 'NewPass123' },
            confirmPassword: { type: 'string', format: 'password', example: 'NewPass123' },
          },
        },
        UpdatePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword', 'confirmPassword'],
          properties: {
            currentPassword: { type: 'string', format: 'password', example: 'OldPass123' },
            newPassword: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'NewPass456',
              description: 'Minimum 8 characters, at least one number.',
            },
            confirmPassword: { type: 'string', format: 'password', example: 'NewPass456' },
          },
        },
        // ─── Student Management ───────────────────────────────────────
        Student: {
          type: 'object',
          description: 'Safe student representation — never includes passwordHash, tokenVersion, or reset token fields.',
          properties: {
            id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            name: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', format: 'email', example: 'jane.smith@example.com' },
            isActive: { type: 'boolean', example: true },
            isFirstLogin: { type: 'boolean', example: true },
            totalAttempts: { type: 'integer', example: 0 },
            totalMockTests: { type: 'integer', example: 0 },
            lastActiveAt: { type: 'string', format: 'date-time', nullable: true, example: null },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateStudentRequest: {
          type: 'object',
          required: ['name', 'email', 'temporaryPassword'],
          properties: {
            name: { type: 'string', maxLength: 100, example: 'Jane Smith' },
            email: { type: 'string', format: 'email', example: 'jane.smith@example.com' },
            temporaryPassword: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'Temp123',
              description: 'Temporary password. Student is forced to change it on first login.',
            },
          },
        },
        UpdateStudentRequest: {
          type: 'object',
          description: 'At least one field must be provided. Only name and email can be updated.',
          properties: {
            name: { type: 'string', maxLength: 100, example: 'Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
          },
        },
        ResetStudentPasswordRequest: {
          type: 'object',
          required: ['newTemporaryPassword'],
          properties: {
            newTemporaryPassword: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'NewTemp123',
              description: 'New temporary password. Forces isFirstLogin=true and invalidates all sessions.',
            },
          },
        },
        ToggleStudentStatusRequest: {
          type: 'object',
          required: ['isActive'],
          properties: {
            isActive: { type: 'boolean', example: false },
          },
        },
        // ─── Speaking ─────────────────────────────────────────────────
        SpeakingQuestionStudent: {
          type: 'object',
          description: 'Student-facing question view. Never includes acceptedAnswers or imagePublicId.',
          properties: {
            id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            type: {
              type: 'string',
              enum: ['read_aloud', 'repeat_sentence', 'describe_image', 'respond_situation', 'answer_short'],
              example: 'read_aloud',
            },
            content: { type: 'string', example: 'The quick brown fox jumps over the lazy dog.' },
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
              enum: ['read_aloud', 'repeat_sentence', 'describe_image', 'respond_situation', 'answer_short'],
              example: 'answer_short',
            },
            content: { type: 'string', example: 'What do you call a person who designs buildings?' },
            imageUrl: { type: 'string', nullable: true, example: null },
            acceptedAnswers: { type: 'array', items: { type: 'string' }, example: ['architect', 'building designer'] },
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
          description: 'Lightweight list item for the student question-picker. preview is null for repeat_sentence (the sentence must not be revealed before recording).',
          properties: {
            id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            type: {
              type: 'string',
              enum: ['read_aloud', 'repeat_sentence', 'describe_image', 'respond_situation', 'answer_short'],
            },
            preview: { type: 'string', nullable: true, example: 'The quick brown fox jumps over the lazy dog near the river.' },
            imageUrl: { type: 'string', nullable: true, example: null },
            speakingTime: { type: 'integer', example: 40 },
            preparationTime: { type: 'integer', example: 30 },
          },
        },
        SpeakingScore: {
          type: 'object',
          description: 'Rule-based score result. Open-ended types have null content; short answers have null fluency. displayScore is on the PTE scale (out of 90).',
          properties: {
            contentScore: { type: 'integer', nullable: true, example: 78 },
            fluencyScore: { type: 'integer', nullable: true, example: 85 },
            pronunciationScore: { type: 'integer', nullable: true, example: 70 },
            engagementScore: { type: 'integer', nullable: true, example: null },
            finalScore: { type: 'number', format: 'float', example: 79.6 },
            displayScore: { type: 'string', example: '72 / 90' },
            wpm: { type: 'integer', nullable: true, example: 132 },
            feedback: { type: 'string', example: 'Your pronunciation could be clearer. Focus on enunciating each word distinctly.' },
            correctAnswer: { type: 'string', description: 'answer_short only — the primary accepted answer.', example: 'architect' },
          },
        },
        // ─── Writing ──────────────────────────────────────────────────
        WritingQuestionStudent: {
          type: 'object',
          description: 'Student-facing writing question view.',
          properties: {
            id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            type: { type: 'string', enum: ['summarise_written_text', 'write_essay'], example: 'summarise_written_text' },
            content: { type: 'string', description: 'Passage text (SWT) or essay prompt (WE).', example: 'The Industrial Revolution transformed manufacturing...' },
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
            preview: { type: 'string', nullable: true, example: 'The Industrial Revolution transformed manufacturing across Europe...' },
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
            type: { type: 'string', enum: ['summarise_written_text', 'write_essay'], example: 'write_essay' },
            content: { type: 'string', example: 'Some people think technology makes life more complex. Discuss.' },
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
          description: 'Rule-based writing score. Word count (50%) + spelling (50%). displayScore is on the PTE scale (out of 90).',
          properties: {
            wordCount: { type: 'integer', example: 52 },
            wordCountScore: { type: 'number', example: 100 },
            spellingScore: { type: 'number', format: 'float', example: 87.3 },
            finalScore: { type: 'number', format: 'float', example: 93.7 },
            displayScore: { type: 'string', example: '84 / 90' },
            feedback: { type: 'string', example: 'Some spelling errors detected. Proofread before submitting.' },
            misspelledWords: { type: 'array', items: { type: 'string' }, example: ['goverment', 'enviromental'] },
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
        // ─── Reading ──────────────────────────────────────────────────
        ReadingQuestionStudent: {
          type: 'object',
          description:
            'Student-facing reading question. Correct answers are ALWAYS stripped: MCQ options omit isCorrect, blanks omit correctAnswer, reorder paragraphs are shuffled out of order.',
          properties: {
            id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            type: { type: 'string', enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] },
            passage: { type: 'string', example: 'The [BLANK] of climate change has become a [BLANK] concern.' },
            question: { type: 'string', nullable: true, example: 'What is the main idea of the passage?' },
            options: {
              type: 'array',
              description: 'MCQ types only — no isCorrect field.',
              items: { type: 'object', properties: { label: { type: 'string', example: 'A' }, text: { type: 'string', example: 'Deforestation' } } },
            },
            blanks: {
              type: 'array',
              description: 'Fill-blank types only — no correctAnswer field.',
              items: { type: 'object', properties: { position: { type: 'integer', example: 0 }, options: { type: 'array', items: { type: 'string' }, example: ['impact', 'affect'] } } },
            },
            wordPool: { type: 'array', description: 'rw_fill_blanks only (shuffled).', items: { type: 'string' }, example: ['impact', 'affect', 'serious', 'minor'] },
            paragraphs: {
              type: 'array',
              description: 'reorder_paragraphs only — shuffled out of correct order.',
              items: { type: 'object', properties: { label: { type: 'string', example: 'C' }, text: { type: 'string', example: 'Finally, ...' } } },
            },
          },
        },
        ReadingQuestionListItem: {
          type: 'object',
          description: 'Lightweight list item for the student question-picker — no answers leaked.',
          properties: {
            id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            type: { type: 'string', enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] },
            preview: { type: 'string', nullable: true, example: 'What is the main idea of the passage about climate change...' },
          },
        },
        ReadingQuestionAdmin: {
          type: 'object',
          description: 'Admin-facing reading question — full document including correct answers and stats.',
          properties: {
            id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            type: { type: 'string', enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] },
            passage: { type: 'string' },
            question: { type: 'string', nullable: true },
            blanks: {
              type: 'array',
              items: { type: 'object', properties: { position: { type: 'integer' }, correctAnswer: { type: 'string' }, options: { type: 'array', items: { type: 'string' } } } },
            },
            options: {
              type: 'array',
              items: { type: 'object', properties: { label: { type: 'string' }, text: { type: 'string' }, isCorrect: { type: 'boolean' } } },
            },
            paragraphs: {
              type: 'array',
              items: { type: 'object', properties: { label: { type: 'string' }, text: { type: 'string' } } },
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
            questionType: { type: 'string', enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] },
            finalScore: { type: 'number', format: 'float', example: 33.3 },
            displayScore: { type: 'string', example: '30 / 90' },
            feedback: { type: 'string', example: 'Good attempt. Review the incorrect answers carefully.' },
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
                  { label: 'A', text: 'Deforestation', selected: true, isCorrect: true, result: 'correct_selected' },
                  { label: 'B', text: 'Solar activity', selected: true, isCorrect: false, result: 'wrong_selected' },
                  { label: 'C', text: 'Industrial emissions', selected: false, isCorrect: true, result: 'missed' },
                ],
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Access token missing or expired.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Invalid or expired token' },
            },
          },
        },
        Forbidden: {
          description: 'Authenticated but insufficient permissions.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Forbidden — insufficient permissions' },
            },
          },
        },
        NotFound: {
          description: 'The requested user/resource was not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'User not found' },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
            },
          },
        },
      },
      requestBodies: {
        SpeakingAudioWithId: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['audio', 'questionId'],
                properties: {
                  audio: { type: 'string', format: 'binary', description: 'Recorded audio (WebM or MP4).' },
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
                  audio: { type: 'string', format: 'binary', description: 'Recorded audio (WebM or MP4).' },
                  questionId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
                  recordingDuration: { type: 'integer', description: 'Actual recording length in seconds. Falls back to the question speakingTime if omitted.', example: 38 },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Server health check' },
      { name: 'Auth', description: 'Login, logout, token refresh, and password management' },
      { name: 'Student Management', description: 'Admin-only CRUD for student accounts. All routes require an admin access token.' },
      { name: 'Speaking Management', description: 'Admin-only CRUD for speaking questions. Image upload supported for Describe Image questions.' },
      { name: 'Speaking', description: 'Student speaking practice — fetch questions and submit audio for rule-based scoring. Audio is discarded immediately after scoring.' },
      { name: 'Writing Management', description: 'Admin-only CRUD for writing questions (Summarise Written Text, Write Essay).' },
      { name: 'Writing', description: 'Student writing practice — fetch questions and submit text for rule-based scoring (word count + spelling). Response text is discarded immediately after scoring.' },
      { name: 'Reading Management', description: 'Admin-only CRUD for reading questions (5 types: R&W fill blanks, MCQ multiple, reorder paragraphs, reading fill blanks, MCQ single).' },
      { name: 'Reading', description: 'Student reading practice — fetch questions (correct answers stripped) and submit answers to a single evaluate endpoint for rule-based scoring. Correct answers are revealed only in the score response.' },
    ],
    paths: {
      // ─── Health ───────────────────────────────────────────────────
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Server health check',
          operationId: 'healthCheck',
          responses: {
            200: {
              description: 'Server is running.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      // ─── Auth ─────────────────────────────────────────────────────
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          description: `Authenticate with email and password.

**Normal login** → returns \`accessToken\` + sets \`refreshToken\` httpOnly cookie.

**First login** → returns \`{ requiresPasswordChange: true, firstLoginToken }\`. Student must call \`POST /auth/change-password\` with this token before accessing any other endpoint. A normal access token on \`/auth/change-password\` returns 403.

**Rate limit:** 5 requests per IP per 15 minutes.`,
          operationId: 'login',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: {
              description: 'Login successful or first-login detected.',
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      { $ref: '#/components/schemas/LoginResponse' },
                      { $ref: '#/components/schemas/FirstLoginResponse' },
                    ],
                  },
                  examples: {
                    normalLogin: {
                      summary: 'Normal login',
                      value: {
                        success: true,
                        accessToken: 'eyJhbGciOiJIUzI1NiJ9...',
                        user: { id: '64f1a2b3c4d5e6f7a8b9c0d1', name: 'Jane Smith', email: 'jane@example.com', role: 'student' },
                      },
                    },
                    firstLogin: {
                      summary: 'First login — must change password',
                      value: { success: true, requiresPasswordChange: true, firstLoginToken: 'eyJhbGciOiJIUzI1NiJ9...' },
                    },
                    adminLogin: {
                      summary: 'Admin login',
                      value: {
                        success: true,
                        accessToken: 'eyJhbGciOiJIUzI1NiJ9...',
                        user: { id: '64f1a2b3c4d5e6f7a8b9c0d2', name: 'Admin', email: 'admin@example.com', role: 'admin' },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Missing email or password.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Email and password are required' },
                },
              },
            },
            401: {
              description: 'Invalid credentials.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Invalid email or password' },
                },
              },
            },
            403: {
              description: 'Account disabled.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Your account has been disabled. Please contact your administrator.' },
                },
              },
            },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          description: `Issues a new access token using the \`refreshToken\` httpOnly cookie. The browser sends the cookie automatically — no body or header needed.

Also validates \`tokenVersion\` — if the token was invalidated (password change or admin reset) this returns 401, and the frontend should redirect to login.

**Testing note:** call \`POST /auth/login\` first in this same browser session so the \`refreshToken\` cookie is set — it is then sent automatically here.`,
          operationId: 'refreshToken',
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: 'New access token issued.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshResponse' } } },
            },
            401: {
              description: 'Refresh token missing, expired, or invalidated.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    missing: { summary: 'No cookie', value: { success: false, message: 'Refresh token required' } },
                    invalid: { summary: 'Bad token', value: { success: false, message: 'Invalid refresh token' } },
                    invalidated: { summary: 'Token version mismatch', value: { success: false, message: 'Token invalidated. Please log in again.' } },
                  },
                },
              },
            },
            403: {
              description: 'Account disabled.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Account disabled' },
                },
              },
            },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout',
          description: 'Clears the `refreshToken` httpOnly cookie. The frontend should also discard the access token from memory.',
          operationId: 'logout',
          responses: {
            200: {
              description: 'Logged out.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessMessage' },
                  example: { success: true, message: 'Logged out successfully' },
                },
              },
            },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user',
          description: 'Returns the profile of the currently authenticated user.',
          operationId: 'getMe',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Current user profile.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      user: { $ref: '#/components/schemas/UserSummary' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/auth/change-password': {
        post: {
          tags: ['Auth'],
          summary: 'Change password — first login only',
          description: `Forces students to set a permanent password on first login.

**Requires the \`firstLoginToken\`** (not a regular access token) in the \`Authorization\` header. Sending a normal access token returns 403.

On success:
- \`isFirstLogin\` set to \`false\`
- \`tokenVersion\` incremented (invalidates the firstLoginToken)
- Full \`accessToken\` + \`refreshToken\` cookie issued`,
          operationId: 'changePasswordFirstLogin',
          security: [{ firstLoginToken: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } },
          },
          responses: {
            200: {
              description: 'Password set. Full tokens issued — student is now logged in.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
            },
            400: {
              description: 'Validation error.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    tooShort: { summary: 'Too short', value: { success: false, message: 'Password must be at least 8 characters' } },
                    noNumber: { summary: 'No number', value: { success: false, message: 'Password must contain at least one number' } },
                    mismatch: { summary: 'Mismatch', value: { success: false, message: 'Passwords do not match' } },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: {
              description: 'Token is not a firstLoginToken.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Forbidden' },
                },
              },
            },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset email',
          description: `Sends a password reset link to the provided email address.

**Always returns the same success message** regardless of whether the email exists — prevents email enumeration attacks.

The reset email contains a link: \`FRONTEND_URL/reset-password?token=<rawToken>&id=<userId>\`

The token is valid for **10 minutes**.`,
          operationId: 'forgotPassword',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } },
          },
          responses: {
            200: {
              description: 'Always returned — even if the email is not registered.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessMessage' },
                  example: { success: true, message: 'If this email is registered, a reset link has been sent.' },
                },
              },
            },
          },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password using email token',
          description: `Validates the reset token and sets a new password.

Extract \`userId\` and \`token\` from the email link query params and send them in the request body.

On success:
- \`resetTokenHash\` and \`resetTokenExpiry\` cleared from DB
- \`tokenVersion\` incremented (kills all active sessions)
- No auto-login — student must log in manually`,
          operationId: 'resetPassword',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } },
          },
          responses: {
            200: {
              description: 'Password reset. Manual login required.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessMessage' },
                  example: { success: true, message: 'Password reset successful. Please log in.' },
                },
              },
            },
            400: {
              description: 'Invalid or expired token, or validation error.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    expired: { summary: 'Link expired', value: { success: false, message: 'This reset link has expired. Please request a new one.' } },
                    invalid: { summary: 'Already used or wrong token', value: { success: false, message: 'Invalid or already used reset link' } },
                    badLink: { summary: 'User not found', value: { success: false, message: 'Invalid reset link' } },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/update-password': {
        post: {
          tags: ['Auth'],
          summary: 'Update own password (logged in)',
          description: `Allows a logged-in student or admin to voluntarily change their own password.

On success:
- \`tokenVersion\` incremented
- Refresh cookie cleared
- User must log in again with the new password`,
          operationId: 'updatePassword',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdatePasswordRequest' } } },
          },
          responses: {
            200: {
              description: 'Password updated. Re-login required.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessMessage' },
                  example: { success: true, message: 'Password updated. Please log in again.' },
                },
              },
            },
            400: {
              description: 'Wrong current password or validation error.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    wrongCurrent: { summary: 'Wrong current password', value: { success: false, message: 'Current password is incorrect' } },
                    tooShort: { summary: 'Too short', value: { success: false, message: 'Password must be at least 8 characters' } },
                    mismatch: { summary: 'Mismatch', value: { success: false, message: 'Passwords do not match' } },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      // ─── Student Management ───────────────────────────────────────
      '/admin/students': {
        post: {
          tags: ['Student Management'],
          summary: 'Create a student account',
          description: 'Admin creates a new student. Email must be unique (case-insensitive). The account starts with `isFirstLogin: true`.',
          operationId: 'createStudent',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStudentRequest' } } },
          },
          responses: {
            201: {
              description: 'Student created.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Student account created successfully.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                          isFirstLogin: { type: 'boolean' },
                          isActive: { type: 'boolean' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error or duplicate email.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    duplicate: { summary: 'Duplicate email', value: { success: false, message: 'A student with this email already exists.' } },
                    shortPassword: { summary: 'Password too short', value: { success: false, message: 'Temporary password must be at least 6 characters.' } },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
        get: {
          tags: ['Student Management'],
          summary: 'List all students',
          description: 'Returns all student accounts sorted by creation date (newest first).',
          operationId: 'listStudents',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'List of students.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          students: { type: 'array', items: { $ref: '#/components/schemas/Student' } },
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
      '/admin/students/{id}': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Student user ID.' },
        ],
        get: {
          tags: ['Student Management'],
          summary: 'Get one student',
          operationId: 'getStudent',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Student found.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: { student: { $ref: '#/components/schemas/Student' } },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: {
              description: 'Student not found.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Student not found' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Student Management'],
          summary: 'Update a student',
          description: 'Update name and/or email only. Password and role cannot be changed here.',
          operationId: 'updateStudent',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateStudentRequest' } } },
          },
          responses: {
            200: {
              description: 'Student updated.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Student updated successfully.' },
                      data: {
                        type: 'object',
                        properties: { student: { $ref: '#/components/schemas/Student' } },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error or duplicate email.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    noFields: { summary: 'No fields provided', value: { success: false, message: 'At least one field (name or email) must be provided.' } },
                    duplicate: { summary: 'Duplicate email', value: { success: false, message: 'A student with this email already exists.' } },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: {
              description: 'Student not found.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Student not found' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Student Management'],
          summary: 'Delete a student permanently',
          description: 'Permanently deletes the student account. Admins cannot delete their own account.',
          operationId: 'deleteStudent',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Student deleted.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessMessage' },
                  example: { success: true, message: 'Student account deleted permanently.' },
                },
              },
            },
            400: {
              description: 'Attempted to delete own account.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Cannot delete your own account.' },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: {
              description: 'Student not found.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Student not found' },
                },
              },
            },
          },
        },
      },
      '/admin/students/{id}/reset-password': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Student user ID.' },
        ],
        patch: {
          tags: ['Student Management'],
          summary: 'Reset a student password',
          description: 'Sets a new temporary password, forces `isFirstLogin: true`, and increments `tokenVersion` (invalidates all active sessions).',
          operationId: 'resetStudentPassword',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetStudentPasswordRequest' } } },
          },
          responses: {
            200: {
              description: 'Password reset.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessMessage' },
                  example: { success: true, message: 'Password reset successfully. Student must change password on next login.' },
                },
              },
            },
            400: {
              description: 'Validation error.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'New temporary password must be at least 6 characters.' },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: {
              description: 'Student not found.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Student not found' },
                },
              },
            },
          },
        },
      },
      '/admin/students/{id}/status': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Student user ID.' },
        ],
        patch: {
          tags: ['Student Management'],
          summary: 'Enable or disable a student account',
          description: 'Toggles `isActive`. Disabling preserves all data. Admins cannot change their own account status.',
          operationId: 'updateStudentStatus',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ToggleStudentStatusRequest' } } },
          },
          responses: {
            200: {
              description: 'Status updated.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessMessage' },
                  examples: {
                    enabled: { summary: 'Enabled', value: { success: true, message: 'Student account enabled.' } },
                    disabled: { summary: 'Disabled', value: { success: true, message: 'Student account disabled.' } },
                  },
                },
              },
            },
            400: {
              description: 'Validation error or attempted to change own status.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    notBoolean: { summary: 'Not a boolean', value: { success: false, message: 'isActive must be a boolean.' } },
                    ownAccount: { summary: 'Own account', value: { success: false, message: 'Cannot change your own account status.' } },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: {
              description: 'Student not found.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Student not found' },
                },
              },
            },
          },
        },
      },
      // ─── Speaking Management (admin) ──────────────────────────────
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
                      enum: ['read_aloud', 'repeat_sentence', 'describe_image', 'respond_situation', 'answer_short'],
                    },
                    content: { type: 'string', description: 'Required for all types except describe_image.' },
                    speakingTime: { type: 'integer', example: 40 },
                    preparationTime: { type: 'integer', example: 30 },
                    acceptedAnswers: { type: 'string', description: 'answer_short only. JSON array or comma-separated, e.g. ["architect","designer"].' },
                    image: { type: 'string', format: 'binary', description: 'describe_image only — JPG/PNG.' },
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
                      message: { type: 'string', example: 'Question created successfully.' },
                      data: { type: 'object', properties: { question: { $ref: '#/components/schemas/SpeakingQuestionAdmin' } } },
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
                  example: { success: false, message: 'content is required for this question type.' },
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
          description: 'Returns all speaking questions sorted newest first. Optional `type` query filter.',
          operationId: 'listSpeakingQuestions',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'type',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['read_aloud', 'repeat_sentence', 'describe_image', 'respond_situation', 'answer_short'],
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
                          questions: { type: 'array', items: { $ref: '#/components/schemas/SpeakingQuestionAdmin' } },
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
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Speaking question ID.' },
        ],
        put: {
          tags: ['Speaking Management'],
          summary: 'Update a speaking question',
          description: 'Updates provided fields only. For describe_image, sending a new `image` replaces and deletes the old Cloudinary asset.',
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
                    acceptedAnswers: { type: 'string', description: 'answer_short only.' },
                    image: { type: 'string', format: 'binary', description: 'describe_image only.' },
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
                      message: { type: 'string', example: 'Question updated successfully.' },
                      data: { type: 'object', properties: { question: { $ref: '#/components/schemas/SpeakingQuestionAdmin' } } },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: {
              description: 'Question not found.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } },
            },
          },
        },
        delete: {
          tags: ['Speaking Management'],
          summary: 'Delete a speaking question',
          description: 'Deletes the question. For describe_image, the Cloudinary image is also removed.',
          operationId: 'deleteSpeakingQuestion',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Question deleted.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' }, example: { success: true, message: 'Question deleted.' } } },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: {
              description: 'Question not found.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } },
            },
          },
        },
      },
      '/admin/speaking/questions/{id}/status': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Speaking question ID.' },
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
                schema: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean', example: false } } },
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
                      data: { type: 'object', properties: { question: { $ref: '#/components/schemas/SpeakingQuestionAdmin' } } },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: {
              description: 'Question not found.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } },
            },
          },
        },
      },
      // ─── Speaking (student) ───────────────────────────────────────
      '/speaking/questions/{type}': {
        get: {
          tags: ['Speaking'],
          summary: 'List active questions of a type',
          description: 'Returns all active questions of the given type for the student question-picker. Never includes acceptedAnswers or imagePublicId; repeat_sentence previews are withheld.',
          operationId: 'listSpeakingQuestionsByType',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'type',
              in: 'path',
              required: true,
              schema: { type: 'string', enum: ['read-aloud', 'repeat-sentence', 'describe-image', 'respond-situation', 'answer-short'] },
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
                          questions: { type: 'array', items: { $ref: '#/components/schemas/SpeakingQuestionListItem' } },
                          total: { type: 'integer', example: 3 },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Invalid type.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Invalid question type.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/speaking/question/{type}/random': {
        get: {
          tags: ['Speaking'],
          summary: 'Get a random question of a type',
          description: 'Returns one random active question of the given type. `acceptedAnswers` and `imagePublicId` are never included.',
          operationId: 'getRandomSpeakingQuestion',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'type',
              in: 'path',
              required: true,
              schema: { type: 'string', enum: ['read-aloud', 'repeat-sentence', 'describe-image', 'respond-situation', 'answer-short'] },
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
                      data: { type: 'object', properties: { question: { $ref: '#/components/schemas/SpeakingQuestionStudent' } } },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: {
              description: 'No active questions available.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'No active questions available.' } } },
            },
          },
        },
      },
      '/speaking/question/{type}/{id}': {
        get: {
          tags: ['Speaking'],
          summary: 'Get a question by type and id',
          description: 'Returns one active question. `acceptedAnswers` and `imagePublicId` are never included.',
          operationId: 'getSpeakingQuestion',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'type',
              in: 'path',
              required: true,
              schema: { type: 'string', enum: ['read-aloud', 'repeat-sentence', 'describe-image', 'respond-situation', 'answer-short'] },
              description: 'Hyphenated question type.',
            },
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Speaking question ID.' },
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
                      data: { type: 'object', properties: { question: { $ref: '#/components/schemas/SpeakingQuestionStudent' } } },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: {
              description: 'Question not found.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } },
            },
          },
        },
      },
      '/speaking/evaluate/read-aloud': {
        post: {
          tags: ['Speaking'],
          summary: 'Evaluate a Read Aloud response',
          description: 'Submit recorded audio (multipart `audio` field) with `questionId`. Audio is transcribed, scored, then deleted. Never stored.',
          operationId: 'evaluateReadAloud',
          security: [{ bearerAuth: [] }],
          requestBody: { $ref: '#/components/requestBodies/SpeakingAudioWithId' },
          responses: {
            200: {
              description: 'Score result.',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/SpeakingScore' } } } } },
            },
            400: { description: 'Missing audio.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Audio file is required.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
      },
      '/speaking/evaluate/repeat-sentence': {
        post: {
          tags: ['Speaking'],
          summary: 'Evaluate a Repeat Sentence response',
          description: 'Submit recorded audio (multipart `audio` field) with `questionId`. Audio is discarded after scoring.',
          operationId: 'evaluateRepeatSentence',
          security: [{ bearerAuth: [] }],
          requestBody: { $ref: '#/components/requestBodies/SpeakingAudioWithId' },
          responses: {
            200: { description: 'Score result.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/SpeakingScore' } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/speaking/evaluate/describe-image': {
        post: {
          tags: ['Speaking'],
          summary: 'Evaluate a Describe Image response',
          description: 'Submit recorded audio (multipart `audio` field) with `questionId` and optional `recordingDuration` (seconds). Audio is discarded after scoring.',
          operationId: 'evaluateDescribeImage',
          security: [{ bearerAuth: [] }],
          requestBody: { $ref: '#/components/requestBodies/SpeakingAudioWithDuration' },
          responses: {
            200: { description: 'Score result.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/SpeakingScore' } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/speaking/evaluate/respond-situation': {
        post: {
          tags: ['Speaking'],
          summary: 'Evaluate a Respond to Situation response',
          description: 'Submit recorded audio (multipart `audio` field) with `questionId` and optional `recordingDuration` (seconds). Audio is discarded after scoring.',
          operationId: 'evaluateRespondSituation',
          security: [{ bearerAuth: [] }],
          requestBody: { $ref: '#/components/requestBodies/SpeakingAudioWithDuration' },
          responses: {
            200: { description: 'Score result.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/SpeakingScore' } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/speaking/evaluate/answer-short': {
        post: {
          tags: ['Speaking'],
          summary: 'Evaluate an Answer Short Question response',
          description: 'Submit recorded audio (multipart `audio` field) with `questionId`. Returns the score and the primary correct answer. Audio is discarded after scoring.',
          operationId: 'evaluateAnswerShort',
          security: [{ bearerAuth: [] }],
          requestBody: { $ref: '#/components/requestBodies/SpeakingAudioWithId' },
          responses: {
            200: { description: 'Score result including correctAnswer.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/SpeakingScore' } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      // ─── Writing Management (admin) ───────────────────────────────
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
                    type: { type: 'string', enum: ['summarise_written_text', 'write_essay'] },
                    content: { type: 'string', description: 'Passage text (SWT) or essay prompt (WE).' },
                    timeLimit: { type: 'integer', description: 'Seconds. Defaults by type if omitted.', example: 600 },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Question created.',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Question created successfully.' }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/WritingQuestionAdmin' } } } } } } },
            },
            400: { description: 'Validation error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'content is required.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
        get: {
          tags: ['Writing Management'],
          summary: 'List writing questions',
          description: 'Returns all writing questions sorted newest first. Optional `type` query filter.',
          operationId: 'listWritingQuestions',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'type', in: 'query', required: false, schema: { type: 'string', enum: ['summarise_written_text', 'write_essay'] }, description: 'Filter by question type.' },
          ],
          responses: {
            200: {
              description: 'List of questions.',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { questions: { type: 'array', items: { $ref: '#/components/schemas/WritingQuestionAdmin' } }, total: { type: 'integer', example: 1 } } } } } } },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/admin/writing/questions/{id}': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Writing question ID.' },
        ],
        get: {
          tags: ['Writing Management'],
          summary: 'Get one writing question',
          operationId: 'getWritingQuestion',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Question found.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/WritingQuestionAdmin' } } } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
        put: {
          tags: ['Writing Management'],
          summary: 'Update a writing question',
          description: 'Updates `content` and/or `timeLimit` only. `type`, `wordMin` and `wordMax` are immutable.',
          operationId: 'updateWritingQuestion',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { content: { type: 'string' }, timeLimit: { type: 'integer' } } } } },
          },
          responses: {
            200: { description: 'Question updated.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Question updated successfully.' }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/WritingQuestionAdmin' } } } } } } } },
            400: { description: 'Validation error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'At least one field (content or timeLimit) must be provided to update.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
        delete: {
          tags: ['Writing Management'],
          summary: 'Delete a writing question',
          operationId: 'deleteWritingQuestion',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Question deleted.', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' }, example: { success: true, message: 'Question deleted.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
      },
      '/admin/writing/questions/{id}/status': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Writing question ID.' },
        ],
        patch: {
          tags: ['Writing Management'],
          summary: 'Toggle question active status',
          description: 'Sets `isActive` to the provided boolean.',
          operationId: 'toggleWritingQuestionStatus',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean', example: false } } } } },
          },
          responses: {
            200: { description: 'Status updated.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Question deactivated.' }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/WritingQuestionAdmin' } } } } } } } },
            400: { description: 'Validation error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'isActive must be a boolean (true or false).' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
      },
      // ─── Writing (student) ────────────────────────────────────────
      '/writing/questions/{type}': {
        get: {
          tags: ['Writing'],
          summary: 'List active questions of a type',
          description: 'Returns all active questions of the given type for the student question-picker.',
          operationId: 'listWritingQuestionsByType',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['summarise', 'essay'] }, description: 'Short question type (summarise | essay).' },
          ],
          responses: {
            200: { description: 'List of active questions.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { questions: { type: 'array', items: { $ref: '#/components/schemas/WritingQuestionListItem' } }, total: { type: 'integer', example: 3 } } } } } } } },
            400: { description: 'Invalid type.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Invalid question type.' } } } },
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
            { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['summarise', 'essay'] }, description: 'Short question type (summarise | essay).' },
          ],
          responses: {
            200: { description: 'A random active question.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/WritingQuestionStudent' } } } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'No active questions available.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'No active questions available.' } } } },
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
            { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['summarise', 'essay'] }, description: 'Short question type (summarise | essay).' },
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Writing question ID.' },
          ],
          responses: {
            200: { description: 'The question.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/WritingQuestionStudent' } } } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
      },
      '/writing/evaluate/summarise': {
        post: {
          tags: ['Writing'],
          summary: 'Evaluate a Summarise Written Text response',
          description: 'Submit `{ questionId, responseText }` as JSON. The text is scored (word count + spelling) then discarded. Never stored.',
          operationId: 'evaluateSummarise',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['questionId', 'responseText'], properties: { questionId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' }, responseText: { type: 'string', example: 'The passage explains how the Industrial Revolution reshaped manufacturing and society.' } } } } },
          },
          responses: {
            200: { description: 'Score result.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/WritingScore' } } } } } },
            400: { description: 'Validation error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'responseText cannot be empty.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
      },
      '/writing/evaluate/essay': {
        post: {
          tags: ['Writing'],
          summary: 'Evaluate a Write Essay response',
          description: 'Submit `{ questionId, responseText }` as JSON. The text is scored (word count + spelling) then discarded. Never stored.',
          operationId: 'evaluateEssay',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['questionId', 'responseText'], properties: { questionId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' }, responseText: { type: 'string', example: 'Technology has undeniably increased the complexity of modern life...' } } } } },
          },
          responses: {
            200: { description: 'Score result.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/WritingScore' } } } } } },
            400: { description: 'Validation error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'responseText cannot be empty.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
      },
      // ─── Reading Management (admin) ───────────────────────────────
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
                    type: { type: 'string', enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] },
                    passage: { type: 'string' },
                    question: { type: 'string', description: 'MCQ types only.' },
                    blanks: { type: 'array', items: { type: 'object', properties: { position: { type: 'integer' }, correctAnswer: { type: 'string' }, options: { type: 'array', items: { type: 'string' } } } }, description: 'Fill-blank types.' },
                    options: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, text: { type: 'string' }, isCorrect: { type: 'boolean' } } }, description: 'MCQ types.' },
                    paragraphs: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, text: { type: 'string' } } }, description: 'Reorder type (correct order).' },
                    wordPool: { type: 'array', items: { type: 'string' }, description: 'rw_fill_blanks only.' },
                  },
                },
                examples: {
                  mcqSingle: { summary: 'MCQ single', value: { type: 'mcq_single', passage: 'Automation is reshaping work...', question: 'What is the main idea?', options: [{ label: 'A', text: 'Tech improves productivity', isCorrect: false }, { label: 'B', text: 'Automation causes unemployment', isCorrect: true }] } },
                  rwFill: { summary: 'R&W fill blanks', value: { type: 'rw_fill_blanks', passage: 'The [BLANK] of climate change is a [BLANK] concern.', wordPool: ['impact', 'affect', 'serious', 'minor'], blanks: [{ position: 0, correctAnswer: 'impact', options: ['impact', 'affect'] }, { position: 1, correctAnswer: 'serious', options: ['serious', 'minor'] }] } },
                  reorder: { summary: 'Reorder', value: { type: 'reorder_paragraphs', passage: 'Arrange the paragraphs.', paragraphs: [{ label: 'A', text: 'First...' }, { label: 'B', text: 'Second...' }, { label: 'C', text: 'Third...' }] } },
                },
              },
            },
          },
          responses: {
            201: { description: 'Question created.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Question created successfully.' }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/ReadingQuestionAdmin' } } } } } } } },
            400: { description: 'Validation error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Exactly one option must be marked correct.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
        get: {
          tags: ['Reading Management'],
          summary: 'List reading questions',
          description: 'Returns all reading questions sorted newest first. Optional `type` query filter.',
          operationId: 'listReadingQuestions',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'type', in: 'query', required: false, schema: { type: 'string', enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] }, description: 'Filter by question type.' },
          ],
          responses: {
            200: { description: 'List of questions.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { questions: { type: 'array', items: { $ref: '#/components/schemas/ReadingQuestionAdmin' } }, total: { type: 'integer', example: 1 } } } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/admin/reading/questions/{id}': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Reading question ID.' },
        ],
        get: {
          tags: ['Reading Management'],
          summary: 'Get one reading question',
          operationId: 'getReadingQuestion',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Question found.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/ReadingQuestionAdmin' } } } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
        put: {
          tags: ['Reading Management'],
          summary: 'Update a reading question',
          description: 'Updates the provided fields only. `type` is immutable. Updated content is re-validated against the existing type.',
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
            200: { description: 'Question updated.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Question updated successfully.' }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/ReadingQuestionAdmin' } } } } } } } },
            400: { description: 'Validation error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'At least one field must be provided to update.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
        delete: {
          tags: ['Reading Management'],
          summary: 'Delete a reading question',
          operationId: 'deleteReadingQuestion',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Question deleted.', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' }, example: { success: true, message: 'Question deleted.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
      },
      '/admin/reading/questions/{id}/status': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Reading question ID.' },
        ],
        patch: {
          tags: ['Reading Management'],
          summary: 'Toggle question active status',
          description: 'Sets `isActive` to the provided boolean.',
          operationId: 'toggleReadingQuestionStatus',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean', example: false } } } } },
          },
          responses: {
            200: { description: 'Status updated.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Question deactivated.' }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/ReadingQuestionAdmin' } } } } } } } },
            400: { description: 'Validation error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'isActive must be a boolean (true or false).' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
      },
      // ─── Reading (student) ────────────────────────────────────────
      '/reading/questions/{type}': {
        get: {
          tags: ['Reading'],
          summary: 'List active questions of a type',
          description: 'Returns all active questions of the given type for the student question-picker (no answers leaked).',
          operationId: 'listReadingQuestionsByType',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] }, description: 'Question type.' },
          ],
          responses: {
            200: { description: 'List of active questions.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { questions: { type: 'array', items: { $ref: '#/components/schemas/ReadingQuestionListItem' } }, total: { type: 'integer', example: 3 } } } } } } } },
            400: { description: 'Invalid type.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Invalid question type.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/reading/{type}/random': {
        get: {
          tags: ['Reading'],
          summary: 'Get a random question of a type',
          description: 'Returns one random active question of the given type, with correct answers stripped.',
          operationId: 'getRandomReadingQuestion',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] }, description: 'Question type.' },
          ],
          responses: {
            200: { description: 'A random active question.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/ReadingQuestionStudent' } } } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'No active questions available.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'No active questions available.' } } } },
          },
        },
      },
      '/reading/{type}/{id}': {
        get: {
          tags: ['Reading'],
          summary: 'Get a question by type and id',
          description: 'Returns one active reading question with correct answers stripped (MCQ options omit isCorrect, blanks omit correctAnswer, reorder paragraphs shuffled).',
          operationId: 'getReadingQuestionStudent',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] }, description: 'Question type.' },
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Reading question ID.' },
          ],
          responses: {
            200: { description: 'The question.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { question: { $ref: '#/components/schemas/ReadingQuestionStudent' } } } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
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
                    questionId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
                    questionType: { type: 'string', enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] },
                    answers: { oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'string' }], description: 'Array of answers; or a single string for mcq_single.' },
                    answer: { type: 'string', description: 'mcq_single alternative (single label).' },
                  },
                },
                examples: {
                  mcqMultiple: { summary: 'MCQ multiple', value: { questionId: '64f1a2b3c4d5e6f7a8b9c0d1', questionType: 'mcq_multiple', answers: ['A', 'C'] } },
                  fillBlanks: { summary: 'Fill blanks', value: { questionId: '64f1a2b3c4d5e6f7a8b9c0d1', questionType: 'rw_fill_blanks', answers: ['impact', 'serious'] } },
                  reorder: { summary: 'Reorder', value: { questionId: '64f1a2b3c4d5e6f7a8b9c0d1', questionType: 'reorder_paragraphs', answers: ['C', 'A', 'B', 'D'] } },
                  mcqSingle: { summary: 'MCQ single', value: { questionId: '64f1a2b3c4d5e6f7a8b9c0d1', questionType: 'mcq_single', answer: 'B' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Score result (correct answers revealed).', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/ReadingScore' } } } } } },
            400: { description: 'Validation error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'answers is required.' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { description: 'Question not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Question not found.' } } } },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
