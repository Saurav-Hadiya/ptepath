import { Response } from 'express';
import { AuthRequest } from '../types';
import { User, IUser } from '../models/user.model';
import { SpeakingQuestion } from '../models/speaking-question.model';
import { WritingQuestion } from '../models/writing-question.model';
import { ReadingQuestion } from '../models/reading-question.model';
import { ListeningQuestion } from '../models/listening-question.model';
import { MockTestTemplate } from '../models/mocktest-template.model';
import { hashPassword } from '../utils/hash.utils';

function safeStudent(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    isFirstLogin: user.isFirstLogin,
    totalAttempts: user.totalAttempts,
    totalMockTests: user.totalMockTests,
    lastActiveAt: user.lastActiveAt,
    createdAt: user.createdAt,
  };
}

export async function createStudent(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, temporaryPassword } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400).json({ success: false, message: 'A student with this email already exists.' });
    return;
  }

  const passwordHash = await hashPassword(temporaryPassword);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'student',
    isActive: true,
    isFirstLogin: true,
    tokenVersion: 0,
    totalAttempts: 0,
    totalMockTests: 0,
    lastActiveAt: null,
  });

  res.status(201).json({
    success: true,
    message: 'Student account created successfully.',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      isFirstLogin: user.isFirstLogin,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
}

export async function listStudents(req: AuthRequest, res: Response): Promise<void> {
  const filter: Record<string, unknown> = { role: 'student' };
  if (req.query.search !== undefined && String(req.query.search).trim() !== '') {
    const escaped = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  const students = users.map(safeStudent);

  res.status(200).json({
    success: true,
    message: 'Students retrieved successfully.',
    data: { students, total: students.length },
  });
}

export async function getStudent(req: AuthRequest, res: Response): Promise<void> {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) {
    res.status(404).json({ success: false, message: 'Student not found' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Student retrieved successfully.',
    data: { student: safeStudent(student) },
  });
}

export async function updateStudent(req: AuthRequest, res: Response): Promise<void> {
  const { name, email } = req.body;

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) {
    res.status(404).json({ success: false, message: 'Student not found' });
    return;
  }

  if (email !== undefined && email !== student.email) {
    const existing = await User.findOne({ email, _id: { $ne: student._id } });
    if (existing) {
      res.status(400).json({ success: false, message: 'A student with this email already exists.' });
      return;
    }
    student.email = email;
  }

  if (name !== undefined) {
    student.name = name;
  }

  await student.save();

  res.status(200).json({
    success: true,
    message: 'Student updated successfully.',
    data: { student: safeStudent(student) },
  });
}

export async function resetStudentPassword(req: AuthRequest, res: Response): Promise<void> {
  const { newTemporaryPassword } = req.body;

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) {
    res.status(404).json({ success: false, message: 'Student not found' });
    return;
  }

  student.passwordHash = await hashPassword(newTemporaryPassword);
  student.isFirstLogin = true;
  student.tokenVersion += 1;
  student.resetTokenHash = null;
  student.resetTokenExpiry = null;
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. Student must change password on next login.',
  });
}

export async function updateStudentStatus(req: AuthRequest, res: Response): Promise<void> {
  const { isActive } = req.body;

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) {
    res.status(404).json({ success: false, message: 'Student not found' });
    return;
  }

  if (req.user!.userId === String(student._id)) {
    res.status(400).json({ success: false, message: 'Cannot change your own account status.' });
    return;
  }

  student.isActive = isActive;
  await student.save();

  res.status(200).json({
    success: true,
    message: isActive ? 'Student account enabled.' : 'Student account disabled.',
  });
}

export async function getStudentDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  const student = await User.findById(req.user!.userId);
  if (!student) {
    res.status(404).json({ success: false, message: 'Student not found' });
    return;
  }

  const [speaking, writing, reading, listening, activeMockTests] = await Promise.all([
    SpeakingQuestion.countDocuments({ isActive: true }),
    WritingQuestion.countDocuments({ isActive: true }),
    ReadingQuestion.countDocuments({ isActive: true }),
    ListeningQuestion.countDocuments({ isActive: true }),
    MockTestTemplate.countDocuments({ isActive: true }),
  ]);

  res.status(200).json({
    success: true,
    message:'Student dashboard stats retrieved successfully.',
    data: {
      studentName: student.name,
      totalAttempts: student.totalAttempts,
      totalMockTests: student.totalMockTests,
      questionCounts: { speaking, writing, reading, listening },
      activeMockTests,
    },
  });
}

export async function deleteStudent(req: AuthRequest, res: Response): Promise<void> {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) {
    res.status(404).json({ success: false, message: 'Student not found' });
    return;
  }

  if (req.user!.userId === String(student._id)) {
    res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    return;
  }

  await student.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Student account deleted permanently.',
  });
}
