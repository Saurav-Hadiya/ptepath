/** OpenAPI tags, schemas and paths for the Auth module. */

export const authTags = [
  {
    name: 'Auth',
    description: 'Login, logout, token refresh, and password management',
  },
];

export const authSchemas = {
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'jane.smith@example.com',
      },
      password: { type: 'string', format: 'password', example: 'MyPass123' },
    },
  },
  LoginResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      accessToken: {
        type: 'string',
        description: 'JWT access token. Store in memory only — never localStorage.',
      },
      user: { $ref: '#/components/schemas/UserSummary' },
    },
  },
  FirstLoginResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      requiresPasswordChange: { type: 'boolean', example: true },
      firstLoginToken: {
        type: 'string',
        description: 'Short-lived token (10 min). Only valid for POST /auth/change-password.',
      },
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
      confirmPassword: {
        type: 'string',
        format: 'password',
        example: 'NewPass123',
      },
    },
  },
  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'jane.smith@example.com',
      },
    },
  },
  ResetPasswordRequest: {
    type: 'object',
    required: ['userId', 'token', 'newPassword', 'confirmPassword'],
    properties: {
      userId: {
        type: 'string',
        example: '64f1a2b3c4d5e6f7a8b9c0d1',
        description: 'From email link query param `id`.',
      },
      token: {
        type: 'string',
        description: 'Raw reset token from email link query param `token`.',
      },
      newPassword: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'NewPass123',
      },
      confirmPassword: {
        type: 'string',
        format: 'password',
        example: 'NewPass123',
      },
    },
  },
  UpdatePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword', 'confirmPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        format: 'password',
        example: 'OldPass123',
      },
      newPassword: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'NewPass456',
        description: 'Minimum 8 characters, at least one number.',
      },
      confirmPassword: {
        type: 'string',
        format: 'password',
        example: 'NewPass456',
      },
    },
  },
};

export const authPaths = {
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
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
          },
        },
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
                    user: {
                      id: '64f1a2b3c4d5e6f7a8b9c0d1',
                      name: 'Jane Smith',
                      email: 'jane@example.com',
                      role: 'student',
                    },
                  },
                },
                firstLogin: {
                  summary: 'First login — must change password',
                  value: {
                    success: true,
                    requiresPasswordChange: true,
                    firstLoginToken: 'eyJhbGciOiJIUzI1NiJ9...',
                  },
                },
                adminLogin: {
                  summary: 'Admin login',
                  value: {
                    success: true,
                    accessToken: 'eyJhbGciOiJIUzI1NiJ9...',
                    user: {
                      id: '64f1a2b3c4d5e6f7a8b9c0d2',
                      name: 'Admin',
                      email: 'admin@example.com',
                      role: 'admin',
                    },
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
              example: {
                success: false,
                message: 'Email and password are required',
              },
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
              example: {
                success: false,
                message: 'Your account has been disabled. Please contact your administrator.',
              },
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
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshResponse' },
            },
          },
        },
        401: {
          description: 'Refresh token missing, expired, or invalidated.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                missing: {
                  summary: 'No cookie',
                  value: { success: false, message: 'Refresh token required' },
                },
                invalid: {
                  summary: 'Bad token',
                  value: { success: false, message: 'Invalid refresh token' },
                },
                invalidated: {
                  summary: 'Token version mismatch',
                  value: {
                    success: false,
                    message: 'Token invalidated. Please log in again.',
                  },
                },
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
      description:
        'Clears the `refreshToken` httpOnly cookie. The frontend should also discard the access token from memory.',
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
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Password set. Full tokens issued — student is now logged in.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginResponse' },
            },
          },
        },
        400: {
          description: 'Validation error.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                tooShort: {
                  summary: 'Too short',
                  value: {
                    success: false,
                    message: 'Password must be at least 8 characters',
                  },
                },
                noNumber: {
                  summary: 'No number',
                  value: {
                    success: false,
                    message: 'Password must contain at least one number',
                  },
                },
                mismatch: {
                  summary: 'Mismatch',
                  value: { success: false, message: 'Passwords do not match' },
                },
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
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Always returned — even if the email is not registered.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessMessage' },
              example: {
                success: true,
                message: 'If this email is registered, a reset link has been sent.',
              },
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
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Password reset. Manual login required.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessMessage' },
              example: {
                success: true,
                message: 'Password reset successful. Please log in.',
              },
            },
          },
        },
        400: {
          description: 'Invalid or expired token, or validation error.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                expired: {
                  summary: 'Link expired',
                  value: {
                    success: false,
                    message: 'This reset link has expired. Please request a new one.',
                  },
                },
                invalid: {
                  summary: 'Already used or wrong token',
                  value: {
                    success: false,
                    message: 'Invalid or already used reset link',
                  },
                },
                badLink: {
                  summary: 'User not found',
                  value: { success: false, message: 'Invalid reset link' },
                },
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
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdatePasswordRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Password updated. Re-login required.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessMessage' },
              example: {
                success: true,
                message: 'Password updated. Please log in again.',
              },
            },
          },
        },
        400: {
          description: 'Wrong current password or validation error.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                wrongCurrent: {
                  summary: 'Wrong current password',
                  value: {
                    success: false,
                    message: 'Current password is incorrect',
                  },
                },
                tooShort: {
                  summary: 'Too short',
                  value: {
                    success: false,
                    message: 'Password must be at least 8 characters',
                  },
                },
                mismatch: {
                  summary: 'Mismatch',
                  value: { success: false, message: 'Passwords do not match' },
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
};
