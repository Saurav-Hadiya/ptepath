import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  // Implemented in 07-authentication-backend
  next();
}
