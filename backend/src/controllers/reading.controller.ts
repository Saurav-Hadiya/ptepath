import { Response } from 'express';
import { AuthRequest } from '../types';

export async function listQuestions(req: AuthRequest, res: Response): Promise<void> {}
export async function getQuestion(req: AuthRequest, res: Response): Promise<void> {}
export async function submitAnswer(req: AuthRequest, res: Response): Promise<void> {}
export async function createQuestion(req: AuthRequest, res: Response): Promise<void> {}
export async function updateQuestion(req: AuthRequest, res: Response): Promise<void> {}
export async function deleteQuestion(req: AuthRequest, res: Response): Promise<void> {}
