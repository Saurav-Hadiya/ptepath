/**
 * Static OpenAPI building blocks shared across every module:
 * API metadata, servers, security schemes, common schemas/responses,
 * and the Health endpoint. Module-specific schemas/paths/tags live in
 * ./modules/* and are assembled in ./index.ts.
 */

export const info = {
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
};

export const servers = [
  {
    url: 'http://localhost:5000/api',
    description: 'Local development',
  },
  {
    url: 'https://ptepath-api.onrender.com/api',
    description: 'Production (Render)',
  },
];

export const securitySchemes = {
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
    description:
      'Short-lived token (10 min) returned on first login. Only valid for POST /auth/change-password.',
  },
  cookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: 'refreshToken',
    description:
      'The 7-day refresh token, set as an httpOnly cookie by POST /auth/login. The browser sends it automatically on same-origin requests — you cannot read or set it from JavaScript. Required by POST /auth/refresh.',
  },
};

export const commonSchemas = {
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
};

export const commonResponses = {
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
        example: {
          success: false,
          message: 'Forbidden — insufficient permissions',
        },
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
        example: {
          success: false,
          message: 'Too many login attempts. Please try again in 15 minutes.',
        },
      },
    },
  },
};

export const healthTag = { name: 'Health', description: 'Server health check' };

export const healthPaths = {
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
};
