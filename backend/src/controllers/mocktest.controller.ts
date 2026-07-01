import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import {
  MockTestTemplate,
  IMockTestTemplate,
  MockTestModule,
} from '../models/mocktest-template.model';
import { User } from '../models/user.model';
import { SpeakingQuestion, ISpeakingQuestion } from '../models/speaking-question.model';
import { WritingQuestion, IWritingQuestion } from '../models/writing-question.model';
import { ReadingQuestion, IReadingQuestion } from '../models/reading-question.model';
import { ListeningQuestion, IListeningQuestion } from '../models/listening-question.model';
import { calculateReadingScore } from '../scoring/reading.scoring';
import { calculateListeningScore } from '../scoring/listening.scoring';
import { scoreWriting } from '../scoring/writing.scoring';
import { WritingQuestionType, ReadingQuestionType, ListeningQuestionType } from '../types';

/**
 * Mock Test module.
 *
 * Templates define how many questions of each type to draw from each module's
 * bank. `start` generates a fresh random set (correct answers stripped);
 * `submit` scores every answer with the EXISTING module scorers — no new
 * scoring logic — and returns module + overall results. No per-attempt records
 * are stored; only template and student counters are updated.
 */

const MODULE_ORDER: MockTestModule[] = ['speaking', 'writing', 'reading', 'listening'];

// ─── Helpers ──────────────────────────────────────────────────────────────

const round1 = (n: number): number => Math.round(n * 10) / 10;
const displayFromScore = (score: number): string => `${Math.round(score * 0.9)} / 90`;
const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

/** Fisher-Yates shuffle on a shallow copy — never mutates the source array. */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Randomly pick up to `count` items — fewer if the pool is smaller. */
function selectRandom<T>(array: T[], count: number): T[] {
  return shuffleArray(array).slice(0, Math.max(0, count));
}

const totalQuestions = (t: IMockTestTemplate): number =>
  t.questionRules.reduce((sum, r) => sum + r.count, 0);

const ruleView = (t: IMockTestTemplate) =>
  t.questionRules.map((r) => ({ module: r.module, type: r.type, count: r.count }));

/** Admin-facing template view — full document including stats. */
function adminView(t: IMockTestTemplate) {
  return {
    id: t._id,
    name: t.name,
    description: t.description,
    totalTime: t.totalTime,
    questionRules: ruleView(t),
    totalQuestions: totalQuestions(t),
    isActive: t.isActive,
    attemptCount: t.attemptCount,
    avgScore: round1(t.avgScore),
    createdAt: t.createdAt,
  };
}

/** Student-facing template view — never exposes attemptCount or avgScore. */
function studentTemplateView(t: IMockTestTemplate) {
  return {
    id: t._id,
    name: t.name,
    description: t.description,
    totalTime: t.totalTime,
    questionRules: ruleView(t),
    totalQuestions: totalQuestions(t),
  };
}

// ─── Per-module "safe" question views (correct answers stripped) ─────────────

function speakingData(q: ISpeakingQuestion): Record<string, unknown> {
  return { content: q.content, imageUrl: q.imageUrl };
}

function writingData(q: IWritingQuestion): Record<string, unknown> {
  return { content: q.content, timeLimit: q.timeLimit, wordMin: q.wordMin, wordMax: q.wordMax };
}

const READING_MCQ: ReadingQuestionType[] = ['mcq_multiple', 'mcq_single'];
const READING_FILL: ReadingQuestionType[] = ['rw_fill_blanks', 'reading_fill_blanks'];

function readingData(q: IReadingQuestion): Record<string, unknown> {
  const base: Record<string, unknown> = {
    passage: q.passage,
    question: READING_MCQ.includes(q.type) ? q.question ?? null : null,
  };
  if (READING_MCQ.includes(q.type)) {
    base.options = q.options.map((o) => ({ label: o.label, text: o.text }));
  }
  if (READING_FILL.includes(q.type)) {
    base.blanks = q.blanks.map((b) => ({ position: b.position, options: b.options }));
  }
  if (q.type === 'rw_fill_blanks') base.wordPool = shuffleArray(q.wordPool);
  if (q.type === 'reorder_paragraphs') {
    // Shuffle out of correct order and drop labels so the order can't be inferred.
    base.paragraphs = shuffleArray(q.paragraphs.map((p) => ({ text: p.text })));
  }
  return base;
}

const LISTENING_QUESTION_TEXT: ListeningQuestionType[] = ['mcq_multiple', 'mcq_single'];
const LISTENING_OPTIONS: ListeningQuestionType[] = [
  'mcq_multiple',
  'mcq_single',
  'highlight_summary',
  'select_missing',
];
const LISTENING_TRANSCRIPT: ListeningQuestionType[] = ['fill_blanks', 'highlight_incorrect'];

function listeningData(q: IListeningQuestion): Record<string, unknown> {
  const base: Record<string, unknown> = {
    audioUrl: q.audioUrl,
    playLimit: q.playLimit,
    question: LISTENING_QUESTION_TEXT.includes(q.type) ? q.question ?? null : null,
  };
  if (LISTENING_OPTIONS.includes(q.type)) {
    base.options = q.options.map((o) => ({ label: o.label, text: o.text }));
  }
  if (LISTENING_TRANSCRIPT.includes(q.type)) base.transcript = q.transcript;
  if (q.type === 'fill_blanks') base.blanks = q.blanks.map((b) => ({ position: b.position }));
  return base;
}

/** Rolling-average update on a template, applied on every submission. */
async function applyTemplateAttempt(template: IMockTestTemplate, overallScore: number): Promise<void> {
  template.attemptCount += 1;
  template.avgScore =
    (template.avgScore * (template.attemptCount - 1) + overallScore) / template.attemptCount;
  await template.save();
}

// ─── Admin Controllers ──────────────────────────────────────────────────────

export async function createTemplate(req: AuthRequest, res: Response): Promise<void> {
  // Body validated & coerced by createMockTestSchema (incl. per-rule type checks).
  const { name, description, totalTime, questionRules } = req.body;

  const created = await MockTestTemplate.create({ name, description, totalTime, questionRules });

  res.status(201).json({
    success: true,
    message: 'Template created successfully.',
    data: { template: adminView(created) },
  });
}

export async function getAllTemplates(req: AuthRequest, res: Response): Promise<void> {
  const templates = await MockTestTemplate.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Templates retrieved successfully.',
    data: { templates: templates.map(adminView), total: templates.length },
  });
}

export async function getOneTemplate(req: AuthRequest, res: Response): Promise<void> {
  const template = await MockTestTemplate.findById(req.params.id);
  if (!template) {
    res.status(404).json({ success: false, message: 'Template not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Template retrieved successfully.',
    data: { template: adminView(template) },
  });
}

export async function updateTemplate(req: AuthRequest, res: Response): Promise<void> {
  const template = await MockTestTemplate.findById(req.params.id);
  if (!template) {
    res.status(404).json({ success: false, message: 'Template not found.' });
    return;
  }

  // Shape already validated by updateMockTestSchema.
  const { name, description, totalTime, questionRules } = req.body as {
    name?: string;
    description?: string;
    totalTime?: number;
    questionRules?: IMockTestTemplate['questionRules'];
  };

  if (name !== undefined) template.name = name;
  if (description !== undefined) template.description = description;
  if (totalTime !== undefined) template.totalTime = totalTime;
  if (questionRules !== undefined) template.questionRules = questionRules;

  await template.save();

  res.status(200).json({
    success: true,
    message: 'Template updated successfully.',
    data: { template: adminView(template) },
  });
}

export async function deleteTemplate(req: AuthRequest, res: Response): Promise<void> {
  const template = await MockTestTemplate.findById(req.params.id);
  if (!template) {
    res.status(404).json({ success: false, message: 'Template not found.' });
    return;
  }

  await template.deleteOne();

  res.status(200).json({ success: true, message: 'Template deleted.' });
}

export async function toggleStatus(req: AuthRequest, res: Response): Promise<void> {
  const template = await MockTestTemplate.findById(req.params.id);
  if (!template) {
    res.status(404).json({ success: false, message: 'Template not found.' });
    return;
  }

  // isActive guaranteed boolean by toggleMockTestStatusSchema.
  template.isActive = req.body.isActive;
  await template.save();

  res.status(200).json({
    success: true,
    message: template.isActive ? 'Template activated.' : 'Template deactivated.',
    data: { template: adminView(template) },
  });
}

// ─── Student Controllers ──────────────────────────────────────────────────────

export async function getActiveTemplates(req: AuthRequest, res: Response): Promise<void> {
  const templates = await MockTestTemplate.find({ isActive: true }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Templates retrieved successfully.',
    data: { templates: templates.map(studentTemplateView) },
  });
}

export async function getTemplateDetail(req: AuthRequest, res: Response): Promise<void> {
  const template = await MockTestTemplate.findOne({ _id: req.params.id, isActive: true });
  if (!template) {
    res.status(404).json({ success: false, message: 'Template not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Template retrieved successfully.',
    data: { template: studentTemplateView(template) },
  });
}

/** Build one "start" question entry with correct answers stripped. */
function buildStartQuestion(
  module: MockTestModule,
  q: ISpeakingQuestion | IWritingQuestion | IReadingQuestion | IListeningQuestion
): Record<string, unknown> {
  let questionData: Record<string, unknown>;
  let speakingTime: number | null = null;
  let preparationTime: number | null = null;

  switch (module) {
    case 'speaking': {
      const sq = q as ISpeakingQuestion;
      questionData = speakingData(sq);
      speakingTime = sq.speakingTime;
      preparationTime = sq.preparationTime;
      break;
    }
    case 'writing':
      questionData = writingData(q as IWritingQuestion);
      break;
    case 'reading':
      questionData = readingData(q as IReadingQuestion);
      break;
    case 'listening':
      questionData = listeningData(q as IListeningQuestion);
      break;
  }

  return {
    id: q._id,
    module,
    questionType: q.type,
    questionData,
    speakingTime,
    preparationTime,
  };
}

type AnyQuestion = ISpeakingQuestion | IWritingQuestion | IReadingQuestion | IListeningQuestion;

/** Fetch all active questions of a type from the module's bank. */
async function fetchPool(module: MockTestModule, type: string): Promise<AnyQuestion[]> {
  switch (module) {
    case 'speaking':
      return SpeakingQuestion.find({ type, isActive: true });
    case 'writing':
      return WritingQuestion.find({ type, isActive: true });
    case 'reading':
      return ReadingQuestion.find({ type, isActive: true });
    case 'listening':
      return ListeningQuestion.find({ type, isActive: true });
  }
}

export async function startMockTest(req: AuthRequest, res: Response): Promise<void> {
  const template = await MockTestTemplate.findOne({ _id: req.params.id, isActive: true });
  if (!template) {
    res.status(404).json({ success: false, message: 'Mock test not found.' });
    return;
  }

  // Bucket per module so the final order is always speaking → writing → reading → listening.
  const buckets: Record<MockTestModule, Record<string, unknown>[]> = {
    speaking: [],
    writing: [],
    reading: [],
    listening: [],
  };

  for (const rule of template.questionRules) {
    // Fresh query every start guarantees random variety across attempts.
    const pool = await fetchPool(rule.module, rule.type);
    if (pool.length === 0) continue; // No questions for this type — skip, no error.

    // count may exceed the pool — selectRandom returns all available in that case.
    const selected = selectRandom(pool, rule.count);
    for (const q of selected) {
      buckets[rule.module].push(buildStartQuestion(rule.module, q));
    }
  }

  const questions = MODULE_ORDER.flatMap((m) => buckets[m]);

  res.status(200).json({
    success: true,
    message: 'Mock test started.',
    data: {
      templateId: template._id,
      templateName: template.name,
      totalTime: template.totalTime,
      totalQuestions: questions.length,
      questions,
    },
  });
}

interface SubmitAnswer {
  questionId: string;
  questionType: string;
  module: MockTestModule;
  answer?: unknown;
  score?: number | null;
}

interface ScoredQuestion {
  questionId: string;
  questionType: string;
  score: number;
  displayScore: string;
  breakdown: unknown;
}

/** Score a single answer with the existing module scorers. Missing data → 0. */
async function scoreAnswer(ans: SubmitAnswer): Promise<{ score: number; breakdown: unknown }> {
  switch (ans.module) {
    case 'speaking': {
      // Pre-scored during the test via Groq; null when skipped / timed out.
      const score = typeof ans.score === 'number' ? round1(ans.score) : 0;
      return { score, breakdown: { preScored: typeof ans.score === 'number' } };
    }
    case 'writing': {
      const result = scoreWriting(
        typeof ans.answer === 'string' ? ans.answer : '',
        ans.questionType as WritingQuestionType
      );
      return { score: result.finalScore, breakdown: result };
    }
    case 'reading': {
      if (!isValidObjectId(ans.questionId)) return { score: 0, breakdown: null };
      const q = await ReadingQuestion.findById(ans.questionId);
      if (!q) return { score: 0, breakdown: null };
      const result = calculateReadingScore(
        ans.questionType as ReadingQuestionType,
        (ans.answer as string | string[]) ?? '',
        q
      );
      return { score: result.finalScore, breakdown: result.breakdown };
    }
    case 'listening': {
      if (!isValidObjectId(ans.questionId)) return { score: 0, breakdown: null };
      const q = await ListeningQuestion.findById(ans.questionId);
      if (!q) return { score: 0, breakdown: null };
      const result = calculateListeningScore(
        ans.questionType as ListeningQuestionType,
        (ans.answer as string | Array<string | number>) ?? '',
        q
      );
      return { score: result.finalScore, breakdown: result.breakdown };
    }
  }
}

export async function submitMockTest(req: AuthRequest, res: Response): Promise<void> {
  // A template may have been deactivated/deleted after the student started —
  // score normally regardless; stats are only updated if the template still exists.
  const template = await MockTestTemplate.findById(req.params.id);

  const { answers, timeTaken } = req.body as { answers: SubmitAnswer[]; timeTaken?: number };

  // Score every answer, bucketed by module.
  const buckets: Record<MockTestModule, ScoredQuestion[]> = {
    speaking: [],
    writing: [],
    reading: [],
    listening: [],
  };

  for (const ans of answers) {
    const { score, breakdown } = await scoreAnswer(ans);
    buckets[ans.module].push({
      questionId: ans.questionId,
      questionType: ans.questionType,
      score: round1(score),
      displayScore: displayFromScore(score),
      breakdown,
    });
  }

  // Module averages (0 when a module has no answered questions).
  const moduleAvg: Record<MockTestModule, number> = {
    speaking: 0,
    writing: 0,
    reading: 0,
    listening: 0,
  };
  let overallSum = 0;
  let modulesWithQuestions = 0;
  for (const m of MODULE_ORDER) {
    const items = buckets[m];
    if (items.length > 0) {
      moduleAvg[m] = round1(items.reduce((sum, q) => sum + q.score, 0) / items.length);
      overallSum += moduleAvg[m];
      modulesWithQuestions += 1;
    }
  }

  // Overall = simple average of the module averages that had at least one answer.
  const overallScore = modulesWithQuestions === 0 ? 0 : round1(overallSum / modulesWithQuestions);

  // Update template stats only if it still exists.
  if (template) await applyTemplateAttempt(template, overallScore);

  // Update student stats — one mock test, plus one attempt per answered question.
  await User.findByIdAndUpdate(req.user!.userId, {
    $inc: { totalAttempts: answers.length, totalMockTests: 1 },
    lastActiveAt: new Date(),
  });

  const buildModule = (m: MockTestModule) => ({
    score: moduleAvg[m],
    displayScore: displayFromScore(moduleAvg[m]),
    questions: buckets[m],
  });

  res.status(200).json({
    success: true,
    message: 'Mock test submitted successfully.',
    data: {
      overallScore,
      displayScore: displayFromScore(overallScore),
      timeTaken: timeTaken ?? template?.totalTime ?? 0,
      questionsAnswered: answers.length,
      modules: {
        speaking: buildModule('speaking'),
        writing: buildModule('writing'),
        reading: buildModule('reading'),
        listening: buildModule('listening'),
      },
    },
  });
}
