import { Response } from 'express';
import { AuthRequest, SpeakingQuestionType } from '../types';
import { SpeakingQuestion, ISpeakingQuestion } from '../models/speaking-question.model';
import { User } from '../models/user.model';
import { deleteResource } from '../services/cloudinary.service';
import transcribeAudio, { AudioInput, TranscriptWord } from '../services/stt.adapter';
import { getTypeConfig, getTypeConfigsMap, upsertTypeConfig } from '../services/question-type-config.service';
import {
  scoreReadAloud,
  scoreRepeatSentence,
  scoreDescribeImage,
  scoreRespondSituation,
  scoreAnswerShort,
  SpeakingScore,
} from '../scoring/speaking.scoring';

/** Timing values for a type — config is the source of truth, question fields are the dual-read fallback. */
interface SpeakingTiming {
  speakingTime: number;
  preparationTime: number;
}

function resolveTiming(question: ISpeakingQuestion, config: Record<string, number>): SpeakingTiming {
  return {
    speakingTime: config.speakingTime ?? question.speakingTime,
    preparationTime: config.preparationTime ?? question.preparationTime,
  };
}

const VALID_TYPES: SpeakingQuestionType[] = [
  'read_aloud',
  'repeat_sentence',
  'describe_image',
  'respond_situation',
  'answer_short',
];

/** URL/query params use hyphens (read-aloud); the DB enum uses underscores. */
function normalizeType(raw: string): SpeakingQuestionType | null {
  const normalized = raw.replace(/-/g, '_') as SpeakingQuestionType;
  return VALID_TYPES.includes(normalized) ? normalized : null;
}

/** Student-facing single-question view — never exposes acceptedAnswers or imagePublicId. */
function studentView(question: ISpeakingQuestion, config: Record<string, number>) {
  const timing = resolveTiming(question, config);
  return {
    id: question._id,
    type: question.type,
    content: question.content,
    imageUrl: question.imageUrl,
    speakingTime: timing.speakingTime,
    preparationTime: timing.preparationTime,
  };
}

// Listening-based types: the prompt is delivered via TTS and must never be
// revealed before the attempt, so their content is withheld from the list.
const HIDDEN_PREVIEW_TYPES: SpeakingQuestionType[] = ['repeat_sentence', 'answer_short'];

/**
 * Student-facing list-item view for the "pick a question" screen.
 * Returns a short preview/title used by the Question List page, except for
 * listening-based types (repeat_sentence, answer_short) whose prompt must not
 * be shown in advance — the frontend labels those by index/type instead.
 */
function listView(question: ISpeakingQuestion, config: Record<string, number>) {
  const hidePreview = HIDDEN_PREVIEW_TYPES.includes(question.type);
  const preview =
    hidePreview || !question.content ? null : question.content.slice(0, 80);
  const timing = resolveTiming(question, config);
  return {
    id: question._id,
    type: question.type,
    preview,
    imageUrl: question.imageUrl,
    speakingTime: timing.speakingTime,
    preparationTime: timing.preparationTime,
  };
}

/** Admin-facing view — full document minus internal Mongoose noise. */
function adminView(question: ISpeakingQuestion, config: Record<string, number>) {
  const timing = resolveTiming(question, config);
  return {
    id: question._id,
    type: question.type,
    content: question.content,
    imageUrl: question.imageUrl,
    acceptedAnswers: question.acceptedAnswers,
    speakingTime: timing.speakingTime,
    preparationTime: timing.preparationTime,
    isActive: question.isActive,
    attemptCount: question.attemptCount,
    avgScore: Math.round(question.avgScore * 10) / 10,
    createdAt: question.createdAt,
  };
}

/** Rolling-average update applied on every submission. */
async function applyAttempt(question: ISpeakingQuestion, finalScore: number): Promise<void> {
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

/** Pull the in-memory audio off the multer request. */
function audioFromRequest(req: AuthRequest): AudioInput | null {
  if (!req.file || !req.file.buffer) return null;
  return { buffer: req.file.buffer, filename: req.file.originalname };
}

// ─── Admin Controllers ──────────────────────────────────────────────────────

export async function addQuestion(req: AuthRequest, res: Response): Promise<void> {
  // Body is already validated & coerced by createSpeakingQuestionSchema.
  const { type, content, acceptedAnswers } = req.body as {
    type: SpeakingQuestionType;
    content?: string;
    acceptedAnswers?: string[];
  };

  // Image upload (describe_image only) — uploadImage stores to Cloudinary.
  let imageUrl: string | null = null;
  let imagePublicId: string | null = null;
  if (type === 'describe_image' && req.file) {
    imageUrl = req.file.path;
    imagePublicId = req.file.filename;
  }

  if (type === 'describe_image' && !imageUrl) {
    res.status(400).json({ success: false, message: 'An image is required for Describe Image questions.' });
    return;
  }

  // Timing is type-level now (QuestionTypeConfig) — the legacy per-question
  // fields are still required by the Mongoose schema (removed in a later
  // cleanup phase), so they're populated from the type's config here purely
  // to satisfy that constraint. Nothing reads them back off the question.
  const config = await getTypeConfig('speaking', type);

  const question = await SpeakingQuestion.create({
    type,
    content: content ?? undefined,
    imageUrl,
    imagePublicId,
    acceptedAnswers: type === 'answer_short' ? acceptedAnswers ?? [] : [],
    speakingTime: config.speakingTime,
    preparationTime: config.preparationTime ?? 0,
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

  const questions = await SpeakingQuestion.find(filter).sort({ createdAt: -1 });
  const configMap = await getTypeConfigsMap('speaking');

  res.status(200).json({
    success: true,
    data: { questions: questions.map((q) => adminView(q, configMap[q.type] ?? {})), total: questions.length },
  });
}

export async function getOneQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await SpeakingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  const config = await getTypeConfig('speaking', question.type);

  res.status(200).json({
    success: true,
    message: 'Question retrieved successfully.',
    data: { question: adminView(question, config) },
  });
}

export async function updateQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await SpeakingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  const { content, acceptedAnswers } = req.body as {
    content?: string;
    acceptedAnswers?: string[];
  };

  if (content !== undefined) question.content = content;

  // acceptedAnswers only applies to answer_short — ignore it for other types.
  if (acceptedAnswers !== undefined && question.type === 'answer_short') {
    question.acceptedAnswers = acceptedAnswers;
  }

  // Replace image (describe_image only) — delete the old asset first.
  if (question.type === 'describe_image' && req.file) {
    if (question.imagePublicId) {
      await deleteResource(question.imagePublicId, 'image');
    }
    question.imageUrl = req.file.path;
    question.imagePublicId = req.file.filename;
  }

  await question.save();

  const config = await getTypeConfig('speaking', question.type);

  res.status(200).json({
    success: true,
    message: 'Question updated successfully.',
    data: { question: adminView(question, config) },
  });
}

export async function deleteQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await SpeakingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  if (question.type === 'describe_image' && question.imagePublicId) {
    await deleteResource(question.imagePublicId, 'image');
  }

  await question.deleteOne();

  res.status(200).json({ success: true, message: 'Question deleted.' });
}

export async function toggleStatus(req: AuthRequest, res: Response): Promise<void> {
  const question = await SpeakingQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // isActive is guaranteed boolean by toggleSpeakingStatusSchema.
  question.isActive = req.body.isActive;
  await question.save();

  const config = await getTypeConfig('speaking', question.type);

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

  // Body validated by speakingTypeSettingsSchema.
  const { speakingTime, preparationTime } = req.body as {
    speakingTime?: number;
    preparationTime?: number;
  };

  const update: Record<string, number> = {};
  if (speakingTime !== undefined) update.speakingTime = speakingTime;
  if (preparationTime !== undefined) update.preparationTime = preparationTime;

  const settings = await upsertTypeConfig('speaking', type, update);

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

  const settings = await getTypeConfig('speaking', type);

  res.status(200).json({ success: true, data: { settings } });
}

// ─── Student Controllers ────────────────────────────────────────────────────

export async function getSpeakingCounts(_req: AuthRequest, res: Response): Promise<void> {
  const counts = await SpeakingQuestion.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  const result: Record<string, number> = {
    read_aloud: 0,
    repeat_sentence: 0,
    describe_image: 0,
    respond_situation: 0,
    answer_short: 0,
  };

  for (const item of counts) {
    result[item._id as string] = item.count;
  }

  res.status(200).json({ success: true, data: result });
}

export async function listQuestionsByType(req: AuthRequest, res: Response): Promise<void> {
  const normalizedType = normalizeType(String(req.params.type));
  if (!normalizedType) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const questions = await SpeakingQuestion.find({ type: normalizedType, isActive: true }).sort({
    createdAt: -1,
  });
  const config = await getTypeConfig('speaking', normalizedType);

  res.status(200).json({
    success: true,
    data: { questions: questions.map((q) => listView(q, config)), total: questions.length },
  });
}

export async function getQuestion(req: AuthRequest, res: Response): Promise<void> {
  const normalizedType = normalizeType(String(req.params.type));
  if (!normalizedType) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const question = await SpeakingQuestion.findOne({
    _id: req.params.id,
    type: normalizedType,
    isActive: true,
  });

  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  const config = await getTypeConfig('speaking', normalizedType);

  res.status(200).json({ success: true, data: { question: studentView(question, config) } });
}

export async function getRandomQuestion(req: AuthRequest, res: Response): Promise<void> {
  const normalizedType = normalizeType(String(req.params.type));
  if (!normalizedType) {
    res.status(400).json({ success: false, message: 'Invalid question type.' });
    return;
  }

  const count = await SpeakingQuestion.countDocuments({ type: normalizedType, isActive: true });
  if (count === 0) {
    res.status(404).json({ success: false, message: 'No active questions available.' });
    return;
  }

  const skip = Math.floor(Math.random() * count);
  const question = await SpeakingQuestion.findOne({ type: normalizedType, isActive: true }).skip(skip);
  if (!question) {
    res.status(404).json({ success: false, message: 'No active questions available.' });
    return;
  }

  const config = await getTypeConfig('speaking', normalizedType);

  res.status(200).json({ success: true, data: { question: studentView(question, config) } });
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

  const current = await SpeakingQuestion.findOne({
    _id: req.params.id,
    type: normalizedType,
    isActive: true,
  });
  if (!current) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  let next = await SpeakingQuestion.findOne({
    type: normalizedType,
    isActive: true,
    _id: { $gt: current._id },
  }).sort({ _id: 1 });

  if (!next) {
    next = await SpeakingQuestion.findOne({ type: normalizedType, isActive: true }).sort({ _id: 1 });
  }
  if (!next) {
    res.status(404).json({ success: false, message: 'No active questions available.' });
    return;
  }

  const config = await getTypeConfig('speaking', normalizedType);

  res.status(200).json({ success: true, data: { question: studentView(next, config) } });
}

/** Shared evaluate flow for the two text-reference types (read aloud, repeat). */
async function evaluateAgainstContent(
  req: AuthRequest,
  res: Response,
  expectedType: SpeakingQuestionType,
  score: (
    transcript: string,
    words: TranscriptWord[],
    content: string,
    speakingTime: number
  ) => SpeakingScore
): Promise<void> {
  const audio = audioFromRequest(req);
  if (!audio) {
    res.status(400).json({ success: false, message: 'Audio file is required.' });
    return;
  }

  const question = await SpeakingQuestion.findOne({
    _id: req.body.questionId,
    type: expectedType,
    isActive: true,
  });
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  const config = await getTypeConfig('speaking', expectedType);
  const timing = resolveTiming(question, config);

  const { transcript, words } = await transcribeAudio(audio);
  const result = score(transcript, words, question.content, timing.speakingTime);

  await applyAttempt(question, result.finalScore);
  await updateStudentStats(req.user!.userId);

  res.status(200).json({ success: true, data: result });
}

export async function evaluateReadAloud(req: AuthRequest, res: Response): Promise<void> {
  await evaluateAgainstContent(req, res, 'read_aloud', scoreReadAloud);
}

export async function evaluateRepeatSentence(req: AuthRequest, res: Response): Promise<void> {
  await evaluateAgainstContent(req, res, 'repeat_sentence', scoreRepeatSentence);
}

/** Shared evaluate flow for the two open-ended types (describe image, respond). */
async function evaluateOpenEnded(
  req: AuthRequest,
  res: Response,
  expectedType: SpeakingQuestionType,
  score: (transcript: string, words: TranscriptWord[], recordingDuration: number) => SpeakingScore
): Promise<void> {
  const audio = audioFromRequest(req);
  if (!audio) {
    res.status(400).json({ success: false, message: 'Audio file is required.' });
    return;
  }

  const question = await SpeakingQuestion.findOne({
    _id: req.body.questionId,
    type: expectedType,
    isActive: true,
  });
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  const config = await getTypeConfig('speaking', expectedType);
  const timing = resolveTiming(question, config);
  const duration =
    req.body.recordingDuration !== undefined ? Number(req.body.recordingDuration) : timing.speakingTime;
  const { transcript, words } = await transcribeAudio(audio);
  const result = score(transcript, words, duration);

  await applyAttempt(question, result.finalScore);
  await updateStudentStats(req.user!.userId);

  res.status(200).json({ success: true, data: result });
}

export async function evaluateDescribeImage(req: AuthRequest, res: Response): Promise<void> {
  await evaluateOpenEnded(req, res, 'describe_image', scoreDescribeImage);
}

export async function evaluateRespondSituation(req: AuthRequest, res: Response): Promise<void> {
  await evaluateOpenEnded(req, res, 'respond_situation', scoreRespondSituation);
}

export async function evaluateAnswerShort(req: AuthRequest, res: Response): Promise<void> {
  const audio = audioFromRequest(req);
  if (!audio) {
    res.status(400).json({ success: false, message: 'Audio file is required.' });
    return;
  }

  const question = await SpeakingQuestion.findOne({
    _id: req.body.questionId,
    type: 'answer_short',
    isActive: true,
  });
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // No fluency scored for short answers — skip word timestamps to cut latency.
  const { transcript } = await transcribeAudio(audio, { wordTimestamps: false });
  const result = scoreAnswerShort(transcript, question.acceptedAnswers);

  await applyAttempt(question, result.finalScore);
  await updateStudentStats(req.user!.userId);

  res.status(200).json({ success: true, data: result });
}
