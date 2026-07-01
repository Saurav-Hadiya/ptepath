/** OpenAPI tags, schemas and paths for the Student Management module. */

export const studentTags = [
  {
    name: 'Student Management',
    description: 'Admin-only CRUD for student accounts. All routes require an admin access token.',
  },
];

export const studentSchemas = {
  Student: {
    type: 'object',
    description:
      'Safe student representation — never includes passwordHash, tokenVersion, or reset token fields.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      name: { type: 'string', example: 'Jane Smith' },
      email: {
        type: 'string',
        format: 'email',
        example: 'jane.smith@example.com',
      },
      isActive: { type: 'boolean', example: true },
      isFirstLogin: { type: 'boolean', example: true },
      totalAttempts: { type: 'integer', example: 0 },
      totalMockTests: { type: 'integer', example: 0 },
      lastActiveAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null,
      },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateStudentRequest: {
    type: 'object',
    required: ['name', 'email', 'temporaryPassword'],
    properties: {
      name: { type: 'string', maxLength: 100, example: 'Jane Smith' },
      email: {
        type: 'string',
        format: 'email',
        example: 'jane.smith@example.com',
      },
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
      email: {
        type: 'string',
        format: 'email',
        example: 'jane.doe@example.com',
      },
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
        description:
          'New temporary password. Forces isFirstLogin=true and invalidates all sessions.',
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
};

export const studentPaths = {
  '/admin/students': {
    post: {
      tags: ['Student Management'],
      summary: 'Create a student account',
      description:
        'Admin creates a new student. Email must be unique (case-insensitive). The account starts with `isFirstLogin: true`.',
      operationId: 'createStudent',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateStudentRequest' },
          },
        },
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
                  message: {
                    type: 'string',
                    example: 'Student account created successfully.',
                  },
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
                duplicate: {
                  summary: 'Duplicate email',
                  value: {
                    success: false,
                    message: 'A student with this email already exists.',
                  },
                },
                shortPassword: {
                  summary: 'Password too short',
                  value: {
                    success: false,
                    message: 'Temporary password must be at least 6 characters.',
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
                      students: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Student' },
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
  '/admin/students/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Student user ID.',
      },
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
                    properties: {
                      student: { $ref: '#/components/schemas/Student' },
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
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateStudentRequest' },
          },
        },
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
                  message: {
                    type: 'string',
                    example: 'Student updated successfully.',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      student: { $ref: '#/components/schemas/Student' },
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
                noFields: {
                  summary: 'No fields provided',
                  value: {
                    success: false,
                    message: 'At least one field (name or email) must be provided.',
                  },
                },
                duplicate: {
                  summary: 'Duplicate email',
                  value: {
                    success: false,
                    message: 'A student with this email already exists.',
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
    delete: {
      tags: ['Student Management'],
      summary: 'Delete a student permanently',
      description:
        'Permanently deletes the student account. Admins cannot delete their own account.',
      operationId: 'deleteStudent',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Student deleted.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessMessage' },
              example: {
                success: true,
                message: 'Student account deleted permanently.',
              },
            },
          },
        },
        400: {
          description: 'Attempted to delete own account.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Cannot delete your own account.',
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
  '/admin/students/{id}/reset-password': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Student user ID.',
      },
    ],
    patch: {
      tags: ['Student Management'],
      summary: 'Reset a student password',
      description:
        'Sets a new temporary password, forces `isFirstLogin: true`, and increments `tokenVersion` (invalidates all active sessions).',
      operationId: 'resetStudentPassword',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ResetStudentPasswordRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Password reset.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessMessage' },
              example: {
                success: true,
                message: 'Password reset successfully. Student must change password on next login.',
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
                message: 'New temporary password must be at least 6 characters.',
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
  '/admin/students/{id}/status': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Student user ID.',
      },
    ],
    patch: {
      tags: ['Student Management'],
      summary: 'Enable or disable a student account',
      description:
        'Toggles `isActive`. Disabling preserves all data. Admins cannot change their own account status.',
      operationId: 'updateStudentStatus',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ToggleStudentStatusRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Status updated.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessMessage' },
              examples: {
                enabled: {
                  summary: 'Enabled',
                  value: { success: true, message: 'Student account enabled.' },
                },
                disabled: {
                  summary: 'Disabled',
                  value: {
                    success: true,
                    message: 'Student account disabled.',
                  },
                },
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
                notBoolean: {
                  summary: 'Not a boolean',
                  value: {
                    success: false,
                    message: 'isActive must be a boolean.',
                  },
                },
                ownAccount: {
                  summary: 'Own account',
                  value: {
                    success: false,
                    message: 'Cannot change your own account status.',
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
  },
};
