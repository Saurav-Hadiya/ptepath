import swaggerJsdoc from 'swagger-jsdoc';

import {
  info,
  servers,
  securitySchemes,
  commonSchemas,
  commonResponses,
  healthTag,
  healthPaths,
} from './base';
import { authTags, authSchemas, authPaths } from './modules/auth';
import { studentTags, studentSchemas, studentPaths } from './modules/student';
import {
  speakingTags,
  speakingSchemas,
  speakingRequestBodies,
  speakingPaths,
} from './modules/speaking';
import { writingTags, writingSchemas, writingPaths } from './modules/writing';
import { readingTags, readingSchemas, readingPaths } from './modules/reading';
import { listeningTags, listeningSchemas, listeningPaths } from './modules/listening';
import { mocktestTags, mocktestSchemas, mocktestPaths } from './modules/mocktest';

/**
 * Swagger / OpenAPI 3.0 spec for the PTEPath API.
 *
 * The spec is split per module for maintainability — each module owns its
 * tags, schemas and paths under ./modules. This file only assembles them in a
 * stable order (the order schemas/paths/tags appear in the rendered docs).
 * Shared building blocks (info, servers, security, common schemas/responses,
 * Health endpoint) live in ./base.
 *
 * Served at GET /api/docs (Swagger UI) and GET /api/docs.json (raw spec).
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info,
    servers,
    components: {
      securitySchemes,
      schemas: {
        ...commonSchemas,
        ...authSchemas,
        ...studentSchemas,
        ...speakingSchemas,
        ...writingSchemas,
        ...readingSchemas,
        ...listeningSchemas,
        ...mocktestSchemas,
      },
      responses: commonResponses,
      requestBodies: {
        ...speakingRequestBodies,
      },
    },
    tags: [
      healthTag,
      ...authTags,
      ...studentTags,
      ...speakingTags,
      ...writingTags,
      ...readingTags,
      ...listeningTags,
      ...mocktestTags,
    ],
    paths: {
      ...healthPaths,
      ...authPaths,
      ...studentPaths,
      ...speakingPaths,
      ...writingPaths,
      ...readingPaths,
      ...listeningPaths,
      ...mocktestPaths,
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
