import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

export function generateAccessToken(userId: string, role: string, tokenVersion: number): string {
  return jwt.sign({ userId, role, tokenVersion }, env.jwt.accessSecret, { expiresIn: '15m' });
}

export function generateRefreshToken(userId: string, tokenVersion: number): string {
  return jwt.sign({ userId, tokenVersion }, env.jwt.refreshSecret, { expiresIn: '7d' });
}

export function generateFirstLoginToken(userId: string): string {
  return jwt.sign({ userId, isFirstLogin: true }, env.jwt.accessSecret, { expiresIn: '10m' });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
}
