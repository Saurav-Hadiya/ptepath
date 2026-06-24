import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { env } from '../config/env';

interface AppError extends Error {
  statusCode?: number;
  code?: number | string;
}

/**
 * Centralized error handler. Maps known error types (Mongoose cast/validation,
 * duplicate key, malformed JSON) to clean 4xx responses and falls back to 500
 * for everything unexpected. Stack traces only leak in development.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // next is required so Express recognizes this as an error handler (4 args).
  _next: NextFunction
): void {
  if (env.isDevelopment) {
    console.error(err);
  }

  let statusCode = err.statusCode ?? 500;
  let message = err.message || 'Internal server error';

  // Malformed JSON body (thrown by express.json()).
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body.';
  }
  // Invalid ObjectId / type cast failure.
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid ID format.';
  }
  // Mongoose schema validation failure.
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)[0]?.message ?? 'Validation failed.';
  }
  // Duplicate key (unique index violation).
  else if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with these details already exists.';
  }
  // Multer upload errors (file too large, unexpected field, etc.).
  else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : 'File upload error.';
  }

  // Never expose internal details for unexpected 500s in production.
  if (statusCode === 500 && !env.isDevelopment) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDevelopment && { stack: err.stack }),
  });
}
