import { Response } from 'express';
import { AuthRequest, WritingQuestionType } from '../types';
import { WritingQuestion, IWritingQuestion } from '../models/writing-question.model';
import { User } from '../models/user.model';
import { scoreWriting, WritingScore } from '../scoring/writing.scoring';

/** Per-type defaults and immutable word ranges. */
const TYPE_CONFIG: Record<
  WritingQuestionType,
  { wordMin: number; wordMax: number; defaultTimeLimit: number }
> = {
  summarise_written_text: { wordMin: 5, wordMax: 75, defaultTimeLimit: 600 },
  write_essay: { wordMin: 200, wordMax: 300, defaultTimeLimit: 1200 },
};

/** Map canonical / hyphenated / short URL forms to the DB enum. */
function normalizeType(raw: string): WritingQuestionType | null {
  const v = raw.trim().toLowerCase().replace(/-/g, '_');
  if (v === 'summarise' || v === 'summarise_written_text' || v === 'swt') {
    return 'summarise_written_text';
  }
  if (v === 'essay' || v === 'write_essay' || v === 'we') return 'write_essay';
  return null;
}

/** Student-facing single-question view. */
function studentView(question: IWritingQuestion) {
  return {
    id: question._id,
    type: question.type,
    content: question.content,
    timeLimit: question.timeLimit,
    wordMin: question.wordMin,
    wordMax: question.wordMax,
  };
}

/** Student-facing list-item view for the "pick a question" screen. */
function listView(question: IWritingQuestion) {
  return {
    id: question._id,
    type: question.type,
    preview: question.content ? question.content.slice(0, 120) : null,
    timeLimit: question.timeLimit,
    wordMin: question.wordMin,
    wordMax: question.wordMax,
  };
}

/** Admin-facing view — full document minus internal Mongoose noise. */
function adminView(question: IWritingQuestion) {
  return {
    id: question._id,
    type: question.type,
    content: question.content,
    timeLimit: question.timeLimit,
    wordMin: question.wordMin,
    wordMax: question.wordMax,
    isActive: question.isActive,
    attemptCount: question.attemptCount,
    avgScore: Math.round(question.avgScore * 10) / 10,
    createdAt: question.createdAt,
  };
}

/** Rolling-average update applied on every submission. */
async function applyAttempt(question: IWritingQuestion, finalScore: number): Promise<void> {
  question.attemptCount += 1;
  question.avgScore =
    (question.avgScore * (question.attemptCount - 1) + finalScore) / question.attemptCount;
  await question.save();
}

/** Student stats update applied on every submission. */
async function updateStudentStats(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $inc: { totalAttempts: 1 },
    lastActiveAt: new Date(),
  });
}

/** Build the full score response payload (score result + breakdown). */
function scoreResponse(result: WritingScore, question: IWritingQuestion) {
  return {
    wordCount: result.wordCount,
    wordCountScore: result.wordCountScore,
    spellingScore: result.spellingScore,
    finalScore: result.finalScore,
    displayScore: result.displayScore,
    feedback: result.feedback,
    misspelledWords: result.misspelledWords,
    breakdown: {
      wordCount: {
        score: result.wordCountScore,
        actual: result.wordCount,
        min: question.wordMin,
        max: question.wordMax,
      },
      spelling: {
        score: result.spellingScore,
        correct: result.spellingResult.correct,
        incorrect: result.spellingResult.incorrect,
        total: result.spellingResult.total,
      },
    },
  };
}

// ─── Admin Controllers ──────────────────────────────────────────────────────

export async function addQuestion(req: AuthRequest, res: Response): Promise<void> {
  // Body is already validated & coerced by createWritingQuestionSchema.
  const { type, content, timeLimit } = req.body as {
    type: WritingQuestionType;
    content: string;
    timeLimit?: number;
  };

  const config = TYPE_CONFIG[type];

  const question = await WritingQuestion.create({
    type,
    content,
    timeLimit: timeLimit ?? config.defaultTimeLimit,
    wordMin: config.wordMin,
    wordMax: config.wordMax,
  });

  res.status(201).json({
    success: true,
    message: 'Question created successfully.',
    data: { question: adminView(question) },
  });
}

export async function getAllQuestions(req: AuthRequest, res: Response): Promise<void> {
  let filter: Record<string, unknown> = {};
  if (req.query.type !== undefined) {
    const typeParam = normalizeType(String(req.query.type));
    if (!typeParam) {
      res.status(400).json({ success: false, message: 'Invalid question type filter.' });
      return;
    }
    filter = { type: typeParam };
  }

  const questions = await WritingQuestion.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { questions: questions.map(adminView), total: questions.length },
  });
}

export async function getOneQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await WritingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  res.status(200).json({ success: true, data: { question: adminView(question) } });
}

export async function updateQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await WritingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  const { content, timeLimit } = req.body as { content?: string; timeLimit?: number };

  // type, wordMin and wordMax are immutable — only content and timeLimit change.
  if (content !== undefined) question.content = content;
  if (timeLimit !== undefined) question.timeLimit = timeLimit;

  await question.save();

  res.status(200).json({
    success: true,
    message: 'Question updated successfully.',
    data: { question: adminView(question) },
  });
}

export async function deleteQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await WritingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  await question.deleteOne();

  res.status(200).json({ success: true, message: 'Question deleted.' });
}

export async function toggleStatus(req: AuthRequest, res: Response): Promise<void> {
  const question = await WritingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // isActive is guaranteed boolean by toggleWritingStatusSchema.
  question.isActive = req.body.isActive;
  await question.save();

  res.status(200).json({
    success: true,
    message: question.isActive ? 'Question activated.' : 'Question deactivated.',
    data: { question: adminView(question) },
  });
}

// ─── Student Controllers ────────────────────────────────────────────────────

export async function listQuestionsByType(req: AuthRequest, res: Response): Promise<void> {
  const normalizedType = normalizeType(String(req.params.type));
  if (!normalizedType) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const questions = await WritingQuestion.find({ type: normalizedType, isActive: true }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    data: { questions: questions.map(listView), total: questions.length },
  });
}

export async function getRandomQuestion(req: AuthRequest, res: Response): Promise<void> {
  const normalizedType = normalizeType(String(req.params.type));
  if (!normalizedType) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const count = await WritingQuestion.countDocuments({ type: normalizedType, isActive: true });
  if (count === 0) {
    res.status(404).json({ success: false, message: 'No active questions available.' });
    return;
  }

  const skip = Math.floor(Math.random() * count);
  const question = await WritingQuestion.findOne({ type: normalizedType, isActive: true }).skip(skip);
  if (!question) {
    res.status(404).json({ success: false, message: 'No active questions available.' });
    return;
  }

  res.status(200).json({ success: true, data: { question: studentView(question) } });
}

export async function getQuestion(req: AuthRequest, res: Response): Promise<void> {
  const normalizedType = normalizeType(String(req.params.type));
  if (!normalizedType) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const question = await WritingQuestion.findOne({
    _id: req.params.id,
    type: normalizedType,
    isActive: true,
  });

  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  res.status(200).json({ success: true, data: { question: studentView(question) } });
}

/** Shared evaluate flow for both writing question types. */
async function evaluate(
  req: AuthRequest,
  res: Response,
  expectedType: WritingQuestionType
): Promise<void> {
  // Body validated & coerced by evaluateWritingSchema.
  const { questionId, responseText } = req.body as { questionId: string; responseText: string };

  const question = await WritingQuestion.findOne({
    _id: questionId,
    type: expectedType,
    isActive: true,
  });
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // responseText is scored then discarded — never persisted.
  const result = scoreWriting(responseText, expectedType);

  await applyAttempt(question, result.finalScore);
  await updateStudentStats(req.user!.userId);

  res.status(200).json({ success: true, data: scoreResponse(result, question) });
}

export async function evaluateSummarise(req: AuthRequest, res: Response): Promise<void> {
  await evaluate(req, res, 'summarise_written_text');
}

export async function evaluateEssay(req: AuthRequest, res: Response): Promise<void> {
  await evaluate(req, res, 'write_essay');
}
