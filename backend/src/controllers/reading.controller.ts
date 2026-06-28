import { Response } from 'express';
import { AuthRequest, ReadingQuestionType } from '../types';
import { ReadingQuestion, IReadingQuestion } from '../models/reading-question.model';
import { User } from '../models/user.model';
import { calculateReadingScore } from '../scoring/reading.scoring';
import { readingTypeError, ReadingPayload } from '../validators/reading.validators';

const READING_TYPES: ReadingQuestionType[] = [
  'rw_fill_blanks',
  'mcq_multiple',
  'reorder_paragraphs',
  'reading_fill_blanks',
  'mcq_single',
];

const MCQ_TYPES: ReadingQuestionType[] = ['mcq_multiple', 'mcq_single'];
const FILL_TYPES: ReadingQuestionType[] = ['rw_fill_blanks', 'reading_fill_blanks'];

/** Map canonical / hyphenated URL forms to the DB enum. */
function normalizeType(raw: string): ReadingQuestionType | null {
  const v = raw.trim().toLowerCase().replace(/-/g, '_') as ReadingQuestionType;
  return READING_TYPES.includes(v) ? v : null;
}

/** Fisher-Yates shuffle on a shallow copy — never mutates the source array. */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Student-facing view — strips every trace of the correct answer:
 *  - MCQ:      options without isCorrect
 *  - fill:     blanks without correctAnswer (+ shuffled wordPool for rw)
 *  - reorder:  paragraphs shuffled out of correct order
 */
function studentView(question: IReadingQuestion): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: question._id,
    type: question.type,
    passage: question.passage,
    question: question.question ?? null,
  };

  switch (question.type) {
    case 'mcq_multiple':
    case 'mcq_single':
      base.options = question.options.map((o) => ({ label: o.label, text: o.text }));
      break;
    case 'rw_fill_blanks':
      base.blanks = question.blanks.map((b) => ({ position: b.position, options: b.options }));
      base.wordPool = shuffle(question.wordPool);
      break;
    case 'reading_fill_blanks':
      base.blanks = question.blanks.map((b) => ({ position: b.position, options: b.options }));
      break;
    case 'reorder_paragraphs':
      base.paragraphs = shuffle(question.paragraphs.map((p) => ({ label: p.label, text: p.text })));
      break;
  }

  return base;
}

/** Lightweight list item for the student question-picker — no answers leaked. */
function listView(question: IReadingQuestion) {
  const previewSource = question.question || question.passage || '';
  return {
    id: question._id,
    type: question.type,
    preview: previewSource ? previewSource.slice(0, 120) : null,
  };
}

/** Admin-facing view — full document including correct answers. */
function adminView(question: IReadingQuestion) {
  return {
    id: question._id,
    type: question.type,
    passage: question.passage,
    question: question.question ?? null,
    blanks: question.blanks,
    options: question.options,
    paragraphs: question.paragraphs,
    wordPool: question.wordPool,
    isActive: question.isActive,
    attemptCount: question.attemptCount,
    avgScore: Math.round(question.avgScore * 10) / 10,
    createdAt: question.createdAt,
  };
}

/** Rolling-average update applied on every submission. */
async function applyAttempt(question: IReadingQuestion, finalScore: number): Promise<void> {
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

// ─── Admin Controllers ──────────────────────────────────────────────────────

export async function addQuestion(req: AuthRequest, res: Response): Promise<void> {
  // Body validated & coerced (incl. per-type rules) by createReadingQuestionSchema.
  const { type, passage, question, blanks, options, paragraphs, wordPool } = req.body as {
    type: ReadingQuestionType;
    passage: string;
    question?: string;
    blanks?: IReadingQuestion['blanks'];
    options?: IReadingQuestion['options'];
    paragraphs?: IReadingQuestion['paragraphs'];
    wordPool?: string[];
  };

  const created = await ReadingQuestion.create({
    type,
    passage,
    question: MCQ_TYPES.includes(type) ? question : null,
    blanks: FILL_TYPES.includes(type) ? blanks ?? [] : [],
    options: MCQ_TYPES.includes(type) ? options ?? [] : [],
    paragraphs: type === 'reorder_paragraphs' ? paragraphs ?? [] : [],
    wordPool: type === 'rw_fill_blanks' ? wordPool ?? [] : [],
  });

  res.status(201).json({
    success: true,
    message: 'Question created successfully.',
    data: { question: adminView(created) },
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

  const questions = await ReadingQuestion.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Questions retrieved successfully.',
    data: { questions: questions.map(adminView), total: questions.length },
  });
}

export async function getOneQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await ReadingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Question retrieved successfully.',
    data: { question: adminView(question) },
  });
}

export async function updateQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await ReadingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // type is immutable. Structural shape already validated by updateReadingQuestionSchema.
  const { passage, question: questionText, blanks, options, paragraphs, wordPool } = req.body as {
    passage?: string;
    question?: string;
    blanks?: IReadingQuestion['blanks'];
    options?: IReadingQuestion['options'];
    paragraphs?: IReadingQuestion['paragraphs'];
    wordPool?: string[];
  };

  // Build the candidate (existing values overlaid with updates) and re-validate
  // the per-type invariants against the question's existing type.
  const candidate: ReadingPayload = {
    question: questionText !== undefined ? questionText : question.question ?? undefined,
    blanks: blanks !== undefined ? blanks : question.blanks,
    options: options !== undefined ? options : question.options,
    paragraphs: paragraphs !== undefined ? paragraphs : question.paragraphs,
    wordPool: wordPool !== undefined ? wordPool : question.wordPool,
  };

  const message = readingTypeError(question.type, candidate);
  if (message) {
    res.status(400).json({ success: false, message });
    return;
  }

  // Apply only fields relevant to this type so stale data never leaks across types.
  if (passage !== undefined) question.passage = passage;
  if (MCQ_TYPES.includes(question.type)) {
    if (questionText !== undefined) question.question = questionText;
    if (options !== undefined) question.options = options;
  }
  if (FILL_TYPES.includes(question.type) && blanks !== undefined) question.blanks = blanks;
  if (question.type === 'rw_fill_blanks' && wordPool !== undefined) question.wordPool = wordPool;
  if (question.type === 'reorder_paragraphs' && paragraphs !== undefined) {
    question.paragraphs = paragraphs;
  }

  await question.save();

  res.status(200).json({
    success: true,
    message: 'Question updated successfully.',
    data: { question: adminView(question) },
  });
}

export async function deleteQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await ReadingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  await question.deleteOne();

  res.status(200).json({ success: true, message: 'Question deleted.' });
}

export async function toggleStatus(req: AuthRequest, res: Response): Promise<void> {
  const question = await ReadingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // isActive guaranteed boolean by toggleReadingStatusSchema.
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

  const questions = await ReadingQuestion.find({ type: normalizedType, isActive: true }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    message: 'Questions retrieved successfully.',
    data: { questions: questions.map(listView), total: questions.length },
  });
}

export async function getRandomQuestion(req: AuthRequest, res: Response): Promise<void> {
  const normalizedType = normalizeType(String(req.params.type));
  if (!normalizedType) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const count = await ReadingQuestion.countDocuments({ type: normalizedType, isActive: true });
  if (count === 0) {
    res.status(404).json({ success: false, message: 'No active questions available.' });
    return;
  }

  const skip = Math.floor(Math.random() * count);
  const question = await ReadingQuestion.findOne({ type: normalizedType, isActive: true }).skip(skip);
  if (!question) {
    res.status(404).json({ success: false, message: 'No active questions available.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Question retrieved successfully.',
    data: { question: studentView(question) },
  });
}

export async function getQuestion(req: AuthRequest, res: Response): Promise<void> {
  const normalizedType = normalizeType(String(req.params.type));
  if (!normalizedType) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const question = await ReadingQuestion.findOne({
    _id: req.params.id,
    type: normalizedType,
    isActive: true,
  });
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Question retrieved successfully.',
    data: { question: studentView(question) },
  });
}

export async function evaluate(req: AuthRequest, res: Response): Promise<void> {
  // Body validated by evaluateReadingSchema.
  const { questionId, questionType, answers, answer } = req.body as {
    questionId: string;
    questionType: ReadingQuestionType;
    answers?: string[] | string;
    answer?: string;
  };

  const question = await ReadingQuestion.findOne({
    _id: questionId,
    type: questionType,
    isActive: true,
  });
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // Normalise the answer payload into the shape each scorer expects.
  const raw = answers !== undefined ? answers : answer ?? '';
  const studentAnswer: string | string[] =
    questionType === 'mcq_single'
      ? Array.isArray(raw)
        ? raw[0] ?? ''
        : raw
      : Array.isArray(raw)
        ? raw
        : [raw];

  const result = calculateReadingScore(questionType, studentAnswer, question);

  await applyAttempt(question, result.finalScore);
  await updateStudentStats(req.user!.userId);

  res.status(200).json({
    success: true,
    message: 'Answer evaluated successfully.',
    data: result,
  });
}
