import { Response } from 'express';
import { AuthRequest, WritingQuestionType } from '../types';
import { WritingQuestion, IWritingQuestion } from '../models/writing-question.model';
import { User } from '../models/user.model';
import { scoreWriting, WritingScore } from '../scoring/writing.scoring';
import { getTypeConfig, getTypeConfigsMap, upsertTypeConfig } from '../services/question-type-config.service';

/** Timing/word-range values for a type — config is the source of truth, question fields are the dual-read fallback. */
interface WritingConstraints {
  timeLimit: number;
  wordMin: number;
  wordMax: number;
}

function resolveConstraints(question: IWritingQuestion, config: Record<string, number>): WritingConstraints {
  return {
    timeLimit: config.timeLimit ?? question.timeLimit,
    wordMin: config.wordMin ?? question.wordMin,
    wordMax: config.wordMax ?? question.wordMax,
  };
}

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
function studentView(question: IWritingQuestion, config: Record<string, number>) {
  const c = resolveConstraints(question, config);
  return {
    id: question._id,
    type: question.type,
    content: question.content,
    timeLimit: c.timeLimit,
    wordMin: c.wordMin,
    wordMax: c.wordMax,
  };
}

/** Student-facing list-item view for the "pick a question" screen. */
function listView(question: IWritingQuestion, config: Record<string, number>) {
  const c = resolveConstraints(question, config);
  return {
    id: question._id,
    type: question.type,
    preview: question.content ? question.content.slice(0, 120) : null,
    timeLimit: c.timeLimit,
    wordMin: c.wordMin,
    wordMax: c.wordMax,
  };
}

/** Admin-facing view — full document minus internal Mongoose noise. */
function adminView(question: IWritingQuestion, config: Record<string, number>) {
  const c = resolveConstraints(question, config);
  return {
    id: question._id,
    type: question.type,
    content: question.content,
    timeLimit: c.timeLimit,
    wordMin: c.wordMin,
    wordMax: c.wordMax,
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
function scoreResponse(result: WritingScore, question: IWritingQuestion, config: Record<string, number>) {
  const c = resolveConstraints(question, config);
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
        min: c.wordMin,
        max: c.wordMax,
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
  const { type, content } = req.body as {
    type: WritingQuestionType;
    content: string;
  };

  // Timing/word-range is type-level now (QuestionTypeConfig) — the legacy
  // per-question fields are still required by the Mongoose schema (removed in
  // a later cleanup phase), so they're populated from the type's config here
  // purely to satisfy that constraint. Nothing reads them back off the question.
  const config = await getTypeConfig('writing', type);

  const question = await WritingQuestion.create({
    type,
    content,
    timeLimit: config.timeLimit,
    wordMin: config.wordMin,
    wordMax: config.wordMax,
  });

  res.status(201).json({
    success: true,
    message: 'Question created successfully.',
    data: { question: adminView(question, config) },
  });
}

export async function getAllQuestions(req: AuthRequest, res: Response): Promise<void> {
  const filter: Record<string, unknown> = {};
  if (req.query.type !== undefined) {
    const typeParam = normalizeType(String(req.query.type));
    if (!typeParam) {
      res.status(400).json({ success: false, message: 'Invalid question type filter.' });
      return;
    }
    filter.type = typeParam;
  }
  if (req.query.search !== undefined && String(req.query.search).trim() !== '') {
    const escaped = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.content = { $regex: escaped, $options: 'i' };
  }

  const questions = await WritingQuestion.find(filter).sort({ createdAt: -1 });
  const configMap = await getTypeConfigsMap('writing');

  res.status(200).json({
    success: true,
    message: 'Questions retrieved successfully.',
    data: { questions: questions.map((q) => adminView(q, configMap[q.type] ?? {})), total: questions.length },
  });
}

export async function getOneQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await WritingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  const config = await getTypeConfig('writing', question.type);

  res.status(200).json({
    success: true,
    message: 'Question retrieved successfully.',
    data: { question: adminView(question, config) },
  });
}

export async function updateQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await WritingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  const { content } = req.body as { content?: string };

  // type, wordMin, wordMax and timeLimit are immutable at the question level —
  // only content changes; timing is edited via the type-wide settings instead.
  if (content !== undefined) question.content = content;

  await question.save();

  const config = await getTypeConfig('writing', question.type);

  res.status(200).json({
    success: true,
    message: 'Question updated successfully.',
    data: { question: adminView(question, config) },
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

  const config = await getTypeConfig('writing', question.type);

  res.status(200).json({
    success: true,
    message: question.isActive ? 'Question activated.' : 'Question deactivated.',
    data: { question: adminView(question, config) },
  });
}

/** Type-level timing config — applies to every existing and future question of this type. */
export async function updateTypeSettings(req: AuthRequest, res: Response): Promise<void> {
  const type = normalizeType(String(req.params.type ?? ''));
  if (!type) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  // Body validated by writingTypeSettingsSchema.
  const { timeLimit } = req.body as { timeLimit: number };

  const settings = await upsertTypeConfig('writing', type, { timeLimit });

  res.status(200).json({
    success: true,
    message: 'Timing updated for all questions of this type.',
    data: { settings },
  });
}

/** Current type-level timing config. */
export async function getTypeSettings(req: AuthRequest, res: Response): Promise<void> {
  const type = normalizeType(String(req.params.type ?? ''));
  if (!type) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const settings = await getTypeConfig('writing', type);

  res.status(200).json({ success: true, data: { settings } });
}

// ─── Student Controllers ────────────────────────────────────────────────────

export async function getWritingCounts(_req: AuthRequest, res: Response): Promise<void> {
  const counts = await WritingQuestion.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  const result: Record<WritingQuestionType, number> = {
    summarise_written_text: 0,
    write_essay: 0,
  };

  for (const item of counts) {
    result[item._id as WritingQuestionType] = item.count;
  }

  res.status(200).json({ success: true, data: result });
}

export async function listQuestionsByType(req: AuthRequest, res: Response): Promise<void> {
  const normalizedType = normalizeType(String(req.params.type));
  if (!normalizedType) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const questions = await WritingQuestion.find({ type: normalizedType, isActive: true }).sort({
    createdAt: -1,
  });
  const config = await getTypeConfig('writing', normalizedType);

  res.status(200).json({
    success: true,
    message: 'Questions retrieved successfully.',
    data: { questions: questions.map((q) => listView(q, config)), total: questions.length },
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

  const config = await getTypeConfig('writing', normalizedType);

  res.status(200).json({
    success: true,
    message: 'Question retrieved successfully.',
    data: { question: studentView(question, config) },
  });
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

  const config = await getTypeConfig('writing', normalizedType);

  res.status(200).json({
    success: true,
    message: 'Question retrieved successfully.',
    data: { question: studentView(question, config) },
  });
}

/**
 * Deterministic "next question" — the active question of this type with the
 * next-highest _id after the current one, wrapping around to the first
 * (lowest _id) active question of the type when the current one is last.
 */
export async function getNextQuestion(req: AuthRequest, res: Response): Promise<void> {
  const normalizedType = normalizeType(String(req.params.type));
  if (!normalizedType) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const current = await WritingQuestion.findOne({
    _id: req.params.id,
    type: normalizedType,
    isActive: true,
  });
  if (!current) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  let next = await WritingQuestion.findOne({
    type: normalizedType,
    isActive: true,
    _id: { $gt: current._id },
  }).sort({ _id: 1 });

  if (!next) {
    next = await WritingQuestion.findOne({ type: normalizedType, isActive: true }).sort({ _id: 1 });
  }
  if (!next) {
    res.status(404).json({ success: false, message: 'No active questions available.' });
    return;
  }

  const config = await getTypeConfig('writing', normalizedType);

  res.status(200).json({
    success: true,
    message: 'Question retrieved successfully.',
    data: { question: studentView(next, config) },
  });
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

  const config = await getTypeConfig('writing', expectedType);

  res.status(200).json({
    success: true,
    message: 'Response evaluated successfully.',
    data: scoreResponse(result, question, config),
  });
}

export async function evaluateSummarise(req: AuthRequest, res: Response): Promise<void> {
  await evaluate(req, res, 'summarise_written_text');
}

export async function evaluateEssay(req: AuthRequest, res: Response): Promise<void> {
  await evaluate(req, res, 'write_essay');
}
