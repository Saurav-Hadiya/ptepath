import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/user.model';
import { SpeakingQuestion } from '../models/speaking-question.model';
import { WritingQuestion } from '../models/writing-question.model';
import { ReadingQuestion } from '../models/reading-question.model';
import { ListeningQuestion } from '../models/listening-question.model';

type LowestScoringQuestion = {
  id: unknown;
  type: string;
  module: 'speaking' | 'writing' | 'reading' | 'listening';
  content: string;
  attemptCount: number;
  avgScore: number;
};

async function lowestScoringForSpeaking(): Promise<LowestScoringQuestion[]> {
  const questions = await SpeakingQuestion.find({ attemptCount: { $gte: 5 } }).sort({ avgScore: 1 }).limit(5);
  return questions.map((q) => ({
    id: q._id,
    type: q.type,
    module: 'speaking',
    content: q.content || 'Audio question',
    attemptCount: q.attemptCount,
    avgScore: q.avgScore,
  }));
}

async function lowestScoringForWriting(): Promise<LowestScoringQuestion[]> {
  const questions = await WritingQuestion.find({ attemptCount: { $gte: 5 } }).sort({ avgScore: 1 }).limit(5);
  return questions.map((q) => ({
    id: q._id,
    type: q.type,
    module: 'writing',
    content: q.content,
    attemptCount: q.attemptCount,
    avgScore: q.avgScore,
  }));
}

async function lowestScoringForReading(): Promise<LowestScoringQuestion[]> {
  const questions = await ReadingQuestion.find({ attemptCount: { $gte: 5 } }).sort({ avgScore: 1 }).limit(5);
  return questions.map((q) => ({
    id: q._id,
    type: q.type,
    module: 'reading',
    content: q.passage,
    attemptCount: q.attemptCount,
    avgScore: q.avgScore,
  }));
}

async function lowestScoringForListening(): Promise<LowestScoringQuestion[]> {
  const questions = await ListeningQuestion.find({ attemptCount: { $gte: 5 } }).sort({ avgScore: 1 }).limit(5);
  return questions.map((q) => ({
    id: q._id,
    type: q.type,
    module: 'listening',
    content: q.question ?? 'Audio question',
    attemptCount: q.attemptCount,
    avgScore: q.avgScore,
  }));
}

export async function getAdminDashboardStats(_req: AuthRequest, res: Response): Promise<void> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    activeStudents,
    speakingCount,
    writingCount,
    readingCount,
    listeningCount,
    attemptsToday,
    mockTestTotals,
    recentLoginUsers,
    speakingLowest,
    writingLowest,
    readingLowest,
    listeningLowest,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', isActive: true }),
    SpeakingQuestion.countDocuments(),
    WritingQuestion.countDocuments(),
    ReadingQuestion.countDocuments(),
    ListeningQuestion.countDocuments(),
    User.countDocuments({ role: 'student', lastActiveAt: { $gte: startOfToday } }),
    User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: null, totalMockTestAttempts: { $sum: '$totalMockTests' } } },
    ]),
    User.find({ role: 'student' }).sort({ lastActiveAt: -1 }).limit(10),
    lowestScoringForSpeaking(),
    lowestScoringForWriting(),
    lowestScoringForReading(),
    lowestScoringForListening(),
  ]);

  const totalQuestions = speakingCount + writingCount + readingCount + listeningCount;
  const totalMockTestAttempts = mockTestTotals[0]?.totalMockTestAttempts ?? 0;

  const recentLogins = recentLoginUsers.map((student) => ({
    id: student._id,
    name: student.name,
    email: student.email,
    lastActiveAt: student.lastActiveAt,
    isActive: student.isActive,
  }));

  const lowestScoringQuestions = [...speakingLowest, ...writingLowest, ...readingLowest, ...listeningLowest]
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 5)
    .map((question) => ({
      ...question,
      avgScore: Math.round(question.avgScore * 10) / 10,
    }));

  res.status(200).json({
    success: true,
    message: 'Admin dashboard stats retrieved successfully.',
    data: {
      totalStudents,
      activeStudents,
      totalQuestions,
      attemptsToday,
      totalMockTestAttempts,
      recentLogins,
      lowestScoringQuestions,
    },
  });
}
