import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isDev = env.isDevelopment;

  if (isDev) {
    console.error(err);
  }

  const statusCode = err.statusCode ?? 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
}
