import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/hash.utils';
import {
  generateAccessToken,
  generateRefreshToken,
  generateFirstLoginToken,
  verifyRefreshToken,
} from '../utils/jwt.utils';
import { generateResetToken, hashResetToken, compareResetToken } from '../utils/token.utils';
import { sendPasswordResetEmail } from '../services/email.service';
import { env } from '../config/env';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    maxAge: SEVEN_DAYS_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    maxAge: 0,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({
      success: false,
      message: 'Your account has been disabled. Please contact your administrator.',
    });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  if (user.isFirstLogin) {
    const firstLoginToken = generateFirstLoginToken(String(user._id));
    res.status(200).json({
      success: true,
      message: 'Password change required before continuing.',
      requiresPasswordChange: true,
      firstLoginToken,
    });
    return;
  }

  const accessToken = generateAccessToken(String(user._id), user.role, user.tokenVersion);
  const refreshToken = generateRefreshToken(String(user._id), user.tokenVersion);

  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.cookies as { refreshToken?: string };

  if (!refreshToken) {
    res.status(401).json({ success: false, message: 'Refresh token required' });
    return;
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
    return;
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    res.status(401).json({ success: false, message: 'User not found' });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ success: false, message: 'Account disabled' });
    return;
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    res.status(401).json({ success: false, message: 'Token invalidated. Please log in again.' });
    return;
  }

  const accessToken = generateAccessToken(String(user._id), user.role, user.tokenVersion);
  res.status(200).json({ success: true, message: 'Token refreshed.', accessToken });
}

export async function logout(_req: AuthRequest, res: Response): Promise<void> {
  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user!.userId).select('-passwordHash -tokenVersion -resetTokenHash -resetTokenExpiry');
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.status(200).json({
    success: true,
    message: 'User retrieved successfully.',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function changePasswordFirstLogin(req: AuthRequest, res: Response): Promise<void> {
  const { newPassword } = req.body;

  const user = await User.findById(req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  user.passwordHash = await hashPassword(newPassword);
  user.isFirstLogin = false;
  user.tokenVersion += 1;
  await user.save();

  const accessToken = generateAccessToken(String(user._id), user.role, user.tokenVersion);
  const refreshToken = generateRefreshToken(String(user._id), user.tokenVersion);

  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully.',
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const SAME_RESPONSE = {
    success: true,
    message: 'If this email is registered, a reset link has been sent.',
  };

  const { email } = req.body;
  res.status(200).json(SAME_RESPONSE);

  if (typeof email !== 'string' || !email.trim()) return;

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return;

  const rawToken = generateResetToken();
  const hashedToken = await hashResetToken(rawToken);

  user.resetTokenHash = hashedToken;
  user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // expiry 10 minutes
  await user.save();

  const resetLink = `${env.frontendUrl}/reset-password?token=${rawToken}&id=${user._id}`;

  try {
    await sendPasswordResetEmail(user.email, resetLink);
  } catch (err) {
    console.error('Failed to send reset email:', err);
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { userId, token, newPassword } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(400).json({ success: false, message: 'Invalid reset link' });
    return;
  }

  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ success: false, message: 'This reset link has expired. Please request a new one.' });
    return;
  }

  if (!user.resetTokenHash) {
    res.status(400).json({ success: false, message: 'Invalid or already used reset link' });
    return;
  }

  const valid = await compareResetToken(token, user.resetTokenHash);
  if (!valid) {
    res.status(400).json({ success: false, message: 'Invalid or already used reset link' });
    return;
  }

  user.passwordHash = await hashPassword(newPassword);
  user.resetTokenHash = null;
  user.resetTokenExpiry = null;
  user.tokenVersion += 1;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
}

export async function updatePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ success: false, message: 'Current password is incorrect' });
    return;
  }

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1;
  await user.save();

  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: 'Password updated. Please log in again.' });
}
