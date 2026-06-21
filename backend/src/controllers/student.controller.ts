import { Response } from 'express';
import { AuthRequest } from '../types';
import { User, IUser } from '../models/user.model';
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

export async function listStudents(_req: AuthRequest, res: Response): Promise<void> {
  const users = await User.find({ role: 'student' }).sort({ createdAt: -1 });
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
