import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

export function authorize(requiredRole: UserRole) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== requiredRole) {
      res.status(403).json({ success: false, message: 'Forbidden - insufficient permissions' });
      return;
    }
    next();
  };
}
