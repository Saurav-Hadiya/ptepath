import { Response } from 'express';
import { AuthRequest } from '../types';

export async function createStudent(req: AuthRequest, res: Response): Promise<void> {}
export async function listStudents(req: AuthRequest, res: Response): Promise<void> {}
export async function getStudent(req: AuthRequest, res: Response): Promise<void> {}
export async function updateStudent(req: AuthRequest, res: Response): Promise<void> {}
export async function resetStudentPassword(req: AuthRequest, res: Response): Promise<void> {}
export async function updateStudentStatus(req: AuthRequest, res: Response): Promise<void> {}
export async function deleteStudent(req: AuthRequest, res: Response): Promise<void> {}
