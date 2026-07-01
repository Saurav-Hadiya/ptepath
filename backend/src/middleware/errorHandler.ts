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
 * duplicate key, malformed JSON, multer) to clean 4xx responses and falls back
 * to 500 for everything unexpected.
 *
 * Responses always have the shape { success: false, message } — never a stack
 * trace. Server-side logging is concise for expected 4xx client errors and
 * full (with stack) only for unexpected 5xx errors.
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers are already sent, defer to Express's built-in handler — trying
  // to send a second response would crash the request.
  if (res.headersSent) {
    next(err);
    return;
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
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : 'File upload error.';
  }
  // A thrown error with no explicit statusCode is treated as unexpected (500).
  else if (!err.statusCode) {
    statusCode = 500;
  }

  // Never expose internal details for unexpected 500s.
  if (statusCode >= 500) {
    // Full diagnostics server-side only — clients get a generic message.
    console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err);
    message = 'Internal server error';
  } else if (env.isDevelopment) {
    // Expected client error — log a single concise line, no stack trace.
    console.warn(`[${statusCode}] ${req.method} ${req.originalUrl} — ${message}`);
  }

  res.status(statusCode).json({ success: false, message });
}
