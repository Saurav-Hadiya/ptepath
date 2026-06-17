import { Request } from 'express';

export type UserRole = 'student' | 'admin';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  tokenVersion: number;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export interface ScoreResult {
  score: number;
  maxScore: number;
  displayScore: string;
}
