import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/user.model';
import { SpeakingQuestion } from '../models/speaking-question.model';
import { WritingQuestion } from '../models/writing-question.model';
import { ReadingQuestion } from '../models/reading-question.model';
import { ListeningQuestion } from '../models/listening-question.model';

type QuestionTypeScore = {
  type: string;
  module: 'speaking' | 'writing' | 'reading' | 'listening';
  label: string;
  attemptCount: number;
  avgScore: number;
};

const SPEAKING_TYPE_LABELS: Record<string, string> = {
  read_aloud: 'Read Aloud',
  repeat_sentence: 'Repeat Sentence',
  describe_image: 'Describe Image',
  respond_situation: 'Respond to Situation',
  answer_short: 'Answer Short Question',
};

const WRITING_TYPE_LABELS: Record<string, string> = {
  summarise_written_text: 'Summarise Written Text',
  write_essay: 'Write Essay',
};

const READING_TYPE_LABELS: Record<string, string> = {
  multiple_choice_single: 'Multiple Choice (Single)',
  multiple_choice_multiple: 'Multiple Choice (Multiple)',
  reorder_paragraphs: 'Reorder Paragraphs',
  fill_in_blanks_reading: 'Fill in the Blanks (Reading)',
  fill_in_blanks_reading_writing: 'Fill in the Blanks (R&W)',
};

const LISTENING_TYPE_LABELS: Record<string, string> = {
  summarise_spoken_text: 'Summarise Spoken Text',
  multiple_choice_single: 'Multiple Choice (Single)',
  fill_in_blanks: 'Fill in the Blanks',
  highlight_correct_summary: 'Highlight Correct Summary',
  multiple_choice_multiple: 'Multiple Choice (Multiple)',
  select_missing_word: 'Select Missing Word',
  highlight_incorrect_words: 'Highlight Incorrect Words',
  write_from_dictation: 'Write from Dictation',
};

async function lowestScoringTypesByModule<T extends { type: string; attemptCount: number; avgScore: number }>(
  module: 'speaking' | 'writing' | 'reading' | 'listening',
  docs: T[],
  labels: Record<string, string>
): Promise<QuestionTypeScore[]> {
  const byType = new Map<string, { totalWeightedScore: number; totalAttempts: number }>();

  for (const doc of docs) {
    if (doc.attemptCount === 0) continue;
    const existing = byType.get(doc.type);
    if (existing) {
      existing.totalWeightedScore += doc.avgScore * doc.attemptCount;
      existing.totalAttempts += doc.attemptCount;
    } else {
      byType.set(doc.type, {
        totalWeightedScore: doc.avgScore * doc.attemptCount,
        totalAttempts: doc.attemptCount,
      });
    }
  }

  const result: QuestionTypeScore[] = [];
  for (const [type, stats] of byType.entries()) {
    if (stats.totalAttempts < 5) continue;
    result.push({
      type,
      module,
      label: labels[type] ?? type,
      attemptCount: stats.totalAttempts,
      avgScore: Math.round((stats.totalWeightedScore / stats.totalAttempts) * 10) / 10,
    });
  }

  return result;
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
    speakingDocs,
    writingDocs,
    readingDocs,
    listeningDocs,
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
    SpeakingQuestion.find({}, 'type attemptCount avgScore').lean(),
    WritingQuestion.find({}, 'type attemptCount avgScore').lean(),
    ReadingQuestion.find({}, 'type attemptCount avgScore').lean(),
    ListeningQuestion.find({}, 'type attemptCount avgScore').lean(),
  ]);

  const totalQuestions = speakingCount + writingCount + readingCount + listeningCount;
  const totalMockTestAttempts = mockTestTotals[0]?.totalMockTestAttempts ?? 0;

  const recentLogins = recentLoginUsers.map((student) => ({
    id: student._id,
    name: student.name,
    lastActiveAt: student.lastActiveAt,
  }));

  const [speakingTypes, writingTypes, readingTypes, listeningTypes] = await Promise.all([
    lowestScoringTypesByModule('speaking', speakingDocs as { type: string; attemptCount: number; avgScore: number }[], SPEAKING_TYPE_LABELS),
    lowestScoringTypesByModule('writing', writingDocs as { type: string; attemptCount: number; avgScore: number }[], WRITING_TYPE_LABELS),
    lowestScoringTypesByModule('reading', readingDocs as { type: string; attemptCount: number; avgScore: number }[], READING_TYPE_LABELS),
    lowestScoringTypesByModule('listening', listeningDocs as { type: string; attemptCount: number; avgScore: number }[], LISTENING_TYPE_LABELS),
  ]);

  const lowestScoringTypes = [...speakingTypes, ...writingTypes, ...readingTypes, ...listeningTypes]
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 5);

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
      lowestScoringTypes,
    },
  });
}
