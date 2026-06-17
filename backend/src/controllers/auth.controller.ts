import { Request, Response } from 'express';
import { AuthRequest } from '../types';

export async function login(req: Request, res: Response): Promise<void> {}
export async function refresh(req: Request, res: Response): Promise<void> {}
export async function logout(req: AuthRequest, res: Response): Promise<void> {}
export async function getMe(req: AuthRequest, res: Response): Promise<void> {}
export async function changePassword(req: AuthRequest, res: Response): Promise<void> {}
export async function forgotPassword(req: Request, res: Response): Promise<void> {}
export async function resetPassword(req: Request, res: Response): Promise<void> {}
export async function updatePassword(req: AuthRequest, res: Response): Promise<void> {}
