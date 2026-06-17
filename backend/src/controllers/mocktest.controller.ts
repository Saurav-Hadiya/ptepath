import { Response } from 'express';
import { AuthRequest } from '../types';

export async function listTemplates(req: AuthRequest, res: Response): Promise<void> {}
export async function getTemplate(req: AuthRequest, res: Response): Promise<void> {}
export async function startAttempt(req: AuthRequest, res: Response): Promise<void> {}
export async function submitAttempt(req: AuthRequest, res: Response): Promise<void> {}
export async function createTemplate(req: AuthRequest, res: Response): Promise<void> {}
export async function updateTemplate(req: AuthRequest, res: Response): Promise<void> {}
export async function deleteTemplate(req: AuthRequest, res: Response): Promise<void> {}
