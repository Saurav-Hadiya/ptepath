import { Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { AuthRequest } from '../types';

/**
 * Validates and sanitizes `req.body` against a Zod schema.
 * On success the parsed (trimmed/normalized) data replaces `req.body`.
 * On failure responds 400 with the first validation message.
 */
export function validateBody(schema: ZodType) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ success: false, message: firstErrorMessage(result.error) });
      return;
    }

    req.body = result.data;
    next();
  };
}

function firstErrorMessage(error: ZodError): string {
  return error.issues[0]?.message ?? 'Invalid request body.';
}

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Ensures a route param is a well-formed MongoDB ObjectId before it reaches
 * the controller — prevents Mongoose CastErrors on malformed ids and returns
 * a clean 400 instead.
 */
export function validateObjectId(param = 'id') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const value = req.params[param];
    if (typeof value !== 'string' || !OBJECT_ID_REGEX.test(value)) {
      res.status(400).json({ success: false, message: 'Invalid ID format.' });
      return;
    }
    next();
  };
}
