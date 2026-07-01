/** OpenAPI tags, schemas and paths for the Resources module. */

export const resourceTags = [
  {
    name: 'Resource Management',
    description:
      'Admin-only CRUD for resources. Supports PDF (≤15 MB), DOCX (≤10 MB), and images JPG/PNG/WEBP (≤5 MB). Files are stored on Cloudinary.',
  },
  {
    name: 'Resources',
    description:
      'Student resource browser — list and view active resources uploaded by the admin.',
  },
];

export const resourceSchemas = {
  ResourceAdmin: {
    type: 'object',
    description: 'Admin-facing resource — full document including Cloudinary metadata.',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      title: { type: 'string', example: 'PTE Speaking Tips' },
      description: { type: 'string', example: 'Key strategies for the Read Aloud task.' },
      fileUrl: {
        type: 'string',
        example: 'https://res.cloudinary.com/demo/raw/upload/ptepath/resources/pdfs/pte-guide.pdf',
      },
      fileType: { type: 'string', enum: ['pdf', 'docx', 'image'], example: 'pdf' },
      fileName: { type: 'string', example: 'PTE-Speaking-Tips.pdf' },
      fileSize: { type: 'integer', description: 'File size in bytes.', example: 2457600 },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  ResourceStudent: {
    type: 'object',
    description: 'Student-facing resource — safe fields only (no internal IDs).',
    properties: {
      id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
      title: { type: 'string', example: 'PTE Speaking Tips' },
      description: { type: 'string', example: 'Key strategies for the Read Aloud task.' },
      fileUrl: {
        type: 'string',
        example: 'https://res.cloudinary.com/demo/raw/upload/ptepath/resources/pdfs/pte-guide.pdf',
      },
      fileType: { type: 'string', enum: ['pdf', 'docx', 'image'], example: 'pdf' },
      fileName: { type: 'string', example: 'PTE-Speaking-Tips.pdf' },
      fileSize: { type: 'integer', description: 'File size in bytes.', example: 2457600 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
};

export const resourcePaths = {
  // ─── Admin ────────────────────────────────────────────────────────────────
  '/admin/resources': {
    post: {
      tags: ['Resource Management'],
      summary: 'Upload a resource',
      description:
        'Uploads a file to Cloudinary and creates a resource record. Send as `multipart/form-data`. Accepted types: PDF (≤15 MB), DOCX (≤10 MB), JPG/PNG/WEBP (≤5 MB).',
      operationId: 'addResource',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file', 'title', 'description'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'The file to upload (PDF, DOCX, JPG, PNG, or WEBP).',
                },
                title: { type: 'string', example: 'PTE Speaking Tips' },
                description: {
                  type: 'string',
                  example: 'Key strategies for the Read Aloud task.',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Resource uploaded.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Resource uploaded successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      resource: { $ref: '#/components/schemas/ResourceAdmin' },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error or missing file.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                noFile: { value: { success: false, message: 'A file is required.' } },
                badType: {
                  value: {
                    success: false,
                    message: 'Only PDF, DOCX, JPG, PNG, and WEBP files are allowed.',
                  },
                },
                tooLarge: {
                  value: {
                    success: false,
                    message: 'File too large. Maximum size for PDF files is 15 MB.',
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
      tags: ['Resource Management'],
      summary: 'List all resources',
      description: 'Returns all resources (active and inactive) sorted newest first.',
      operationId: 'listAllResources',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of resources.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Resources retrieved successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      resources: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ResourceAdmin' },
                      },
                      total: { type: 'integer', example: 5 },
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
  '/admin/resources/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Resource ID.',
      },
    ],
    get: {
      tags: ['Resource Management'],
      summary: 'Get one resource',
      operationId: 'getOneResource',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Resource found.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Resource retrieved successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      resource: { $ref: '#/components/schemas/ResourceAdmin' },
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
          description: 'Resource not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Resource not found.' },
            },
          },
        },
      },
    },
    put: {
      tags: ['Resource Management'],
      summary: 'Update resource metadata',
      description:
        'Updates title and/or description only. To replace the file, delete and re-upload.',
      operationId: 'updateResource',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Updated Title' },
                description: { type: 'string', example: 'Updated description.' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Resource updated.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Resource updated successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      resource: { $ref: '#/components/schemas/ResourceAdmin' },
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
          description: 'Resource not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Resource not found.' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Resource Management'],
      summary: 'Delete a resource',
      description: 'Deletes the resource record and removes the file from Cloudinary.',
      operationId: 'deleteResource',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Resource deleted.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessMessage' },
              example: { success: true, message: 'Resource deleted.' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: {
          description: 'Resource not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Resource not found.' },
            },
          },
        },
      },
    },
  },
  '/admin/resources/{id}/status': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Resource ID.',
      },
    ],
    patch: {
      tags: ['Resource Management'],
      summary: 'Toggle resource active status',
      description: 'Sets `isActive` to the provided boolean. Inactive resources are hidden from students.',
      operationId: 'toggleResourceStatus',
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
                  message: { type: 'string', example: 'Resource deactivated.' },
                  data: {
                    type: 'object',
                    properties: {
                      resource: { $ref: '#/components/schemas/ResourceAdmin' },
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
              example: { success: false, message: 'isActive must be a boolean (true or false).' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: {
          description: 'Resource not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Resource not found.' },
            },
          },
        },
      },
    },
  },

  // ─── Student ──────────────────────────────────────────────────────────────
  '/resources': {
    get: {
      tags: ['Resources'],
      summary: 'List active resources',
      description: 'Returns all active resources sorted newest first. No correct answers or admin metadata exposed.',
      operationId: 'listResources',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of active resources.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Resources retrieved successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      resources: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ResourceStudent' },
                      },
                      total: { type: 'integer', example: 3 },
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
  '/resources/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Resource ID.',
      },
    ],
    get: {
      tags: ['Resources'],
      summary: 'Get one active resource',
      description: 'Returns a single active resource. The `fileUrl` can be used directly to open or download the file.',
      operationId: 'getResource',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Resource found.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Resource retrieved successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      resource: { $ref: '#/components/schemas/ResourceStudent' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: {
          description: 'Resource not found or inactive.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Resource not found.' },
            },
          },
        },
      },
    },
  },
};
