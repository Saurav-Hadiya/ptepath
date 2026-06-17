import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

export function authorize(requiredRole: UserRole) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Implemented in 07-authentication-backend
    next();
  };
}
