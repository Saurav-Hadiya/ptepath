import { Response } from 'express';
import { AuthRequest, ListeningQuestionType } from '../types';
import { ListeningQuestion, IListeningQuestion } from '../models/listening-question.model';
import { User } from '../models/user.model';
import { deleteResource } from '../services/cloudinary.service';
import { calculateListeningScore } from '../scoring/listening.scoring';
import { listeningTypeError, ListeningPayload } from '../validators/listening.validators';

const LISTENING_TYPES: ListeningQuestionType[] = [
  'summarise_spoken',
  'mcq_multiple',
  'fill_blanks',
  'highlight_summary',
  'mcq_single',
  'select_missing',
  'highlight_incorrect',
  'write_dictation',
];

// Types whose `question` text is relevant (entered/displayed).
const QUESTION_TYPES: ListeningQuestionType[] = ['mcq_multiple', 'mcq_single'];
// Types that carry an options array.
const OPTION_TYPES: ListeningQuestionType[] = [
  'mcq_multiple',
  'mcq_single',
  'highlight_summary',
  'select_missing',
];
// Types that show a transcript to the student.
const TRANSCRIPT_TYPES: ListeningQuestionType[] = ['fill_blanks', 'highlight_incorrect'];

/** Map canonical / hyphenated URL forms to the DB enum. */
function normalizeType(raw: string): ListeningQuestionType | null {
  const v = raw.trim().toLowerCase().replace(/-/g, '_') as ListeningQuestionType;
  return LISTENING_TYPES.includes(v) ? v : null;
}

/**
 * Student-facing view — strips every trace of the correct answer:
 *  - options:               without isCorrect
 *  - blanks:                positions only, no correctWord
 *  - incorrectWordIndices:  never sent (student must find them)
 *  - correctSentence:       never sent
 * Always includes audioUrl + playLimit so the player can run.
 */
function studentView(question: IListeningQuestion): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: question._id,
    type: question.type,
    audioUrl: question.audioUrl,
    playLimit: question.playLimit,
    question: QUESTION_TYPES.includes(question.type) ? question.question ?? null : null,
  };

  if (OPTION_TYPES.includes(question.type)) {
    base.options = question.options.map((o) => ({ label: o.label, text: o.text }));
  }
  if (TRANSCRIPT_TYPES.includes(question.type)) {
    base.transcript = question.transcript;
  }
  if (question.type === 'fill_blanks') {
    base.blanks = question.blanks.map((b) => ({ position: b.position }));
  }

  return base;
}

/** Lightweight list item for the student question-picker — no answers leaked. */
function listView(question: IListeningQuestion) {
  const preview = QUESTION_TYPES.includes(question.type) && question.question
    ? question.question.slice(0, 120)
    : null;
  return {
    id: question._id,
    type: question.type,
    audioUrl: question.audioUrl,
    playLimit: question.playLimit,
    preview,
  };
}

/** Admin-facing view — full document including correct answers (audioPublicId stays internal). */
function adminView(question: IListeningQuestion) {
  return {
    id: question._id,
    type: question.type,
    audioUrl: question.audioUrl,
    playLimit: question.playLimit,
    question: question.question ?? null,
    options: question.options,
    transcript: question.transcript ?? null,
    blanks: question.blanks,
    incorrectWordIndices: question.incorrectWordIndices,
    correctSentence: question.correctSentence ?? null,
    isActive: question.isActive,
    attemptCount: question.attemptCount,
    avgScore: Math.round(question.avgScore * 10) / 10,
    createdAt: question.createdAt,
  };
}

/** Rolling-average update applied on every submission. */
async function applyAttempt(question: IListeningQuestion, finalScore: number): Promise<void> {
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
  // Body validated & coerced (incl. per-type rules) by createListeningQuestionSchema.
  const { type, playLimit, question, options, transcript, blanks, incorrectWordIndices, correctSentence } =
    req.body as {
      type: ListeningQuestionType;
      playLimit?: number;
      question?: string;
      options?: IListeningQuestion['options'];
      transcript?: string;
      blanks?: IListeningQuestion['blanks'];
      incorrectWordIndices?: number[];
      correctSentence?: string;
    };

  // Audio file is mandatory for every type.
  if (!req.file) {
    res.status(400).json({ success: false, message: 'An audio file is required.' });
    return;
  }

  const created = await ListeningQuestion.create({
    type,
    audioUrl: req.file.path,
    audioPublicId: req.file.filename,
    playLimit: playLimit ?? 1,
    question: QUESTION_TYPES.includes(type) ? question ?? null : null,
    options: OPTION_TYPES.includes(type) ? options ?? [] : [],
    transcript: TRANSCRIPT_TYPES.includes(type) ? transcript ?? null : null,
    blanks: type === 'fill_blanks' ? blanks ?? [] : [],
    incorrectWordIndices: type === 'highlight_incorrect' ? incorrectWordIndices ?? [] : [],
    correctSentence: type === 'write_dictation' ? correctSentence ?? null : null,
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

  const questions = await ListeningQuestion.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Questions retrieved successfully.',
    data: { questions: questions.map(adminView), total: questions.length },
  });
}

export async function getOneQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await ListeningQuestion.findById(req.params.id);
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
  const question = await ListeningQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // type is immutable. Structural shape already validated by updateListeningQuestionSchema.
  const { playLimit, question: questionText, options, transcript, blanks, incorrectWordIndices, correctSentence } =
    req.body as {
      playLimit?: number;
      question?: string;
      options?: IListeningQuestion['options'];
      transcript?: string;
      blanks?: IListeningQuestion['blanks'];
      incorrectWordIndices?: number[];
      correctSentence?: string;
    };

  // Build the candidate (existing values overlaid with updates) and re-validate
  // the per-type invariants against the question's existing type.
  const candidate: ListeningPayload = {
    question: questionText !== undefined ? questionText : question.question ?? undefined,
    options: options !== undefined ? options : question.options,
    transcript: transcript !== undefined ? transcript : question.transcript ?? undefined,
    blanks: blanks !== undefined ? blanks : question.blanks,
    incorrectWordIndices:
      incorrectWordIndices !== undefined ? incorrectWordIndices : question.incorrectWordIndices,
    correctSentence:
      correctSentence !== undefined ? correctSentence : question.correctSentence ?? undefined,
  };

  const message = listeningTypeError(question.type, candidate);
  if (message) {
    res.status(400).json({ success: false, message });
    return;
  }

  // Swap the audio file only after validation passes, so a rejected update never
  // destroys the existing asset.
  if (req.file) {
    if (question.audioPublicId) await deleteResource(question.audioPublicId, 'video');
    question.audioUrl = req.file.path;
    question.audioPublicId = req.file.filename;
  }

  // Apply only fields relevant to this type so stale data never leaks across types.
  if (playLimit !== undefined) question.playLimit = playLimit;
  if (QUESTION_TYPES.includes(question.type) && questionText !== undefined) {
    question.question = questionText;
  }
  if (OPTION_TYPES.includes(question.type) && options !== undefined) question.options = options;
  if (TRANSCRIPT_TYPES.includes(question.type) && transcript !== undefined) {
    question.transcript = transcript;
  }
  if (question.type === 'fill_blanks' && blanks !== undefined) question.blanks = blanks;
  if (question.type === 'highlight_incorrect' && incorrectWordIndices !== undefined) {
    question.incorrectWordIndices = incorrectWordIndices;
  }
  if (question.type === 'write_dictation' && correctSentence !== undefined) {
    question.correctSentence = correctSentence;
  }

  await question.save();

  res.status(200).json({
    success: true,
    message: 'Question updated successfully.',
    data: { question: adminView(question) },
  });
}

export async function deleteQuestion(req: AuthRequest, res: Response): Promise<void> {
  const question = await ListeningQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // Remove the audio asset from Cloudinary (resource_type 'video' for audio).
  if (question.audioPublicId) await deleteResource(question.audioPublicId, 'video');
  await question.deleteOne();

  res.status(200).json({ success: true, message: 'Question deleted.' });
}

export async function toggleStatus(req: AuthRequest, res: Response): Promise<void> {
  const question = await ListeningQuestion.findById(req.params.id);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // isActive guaranteed boolean by toggleListeningStatusSchema.
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

  const questions = await ListeningQuestion.find({ type: normalizedType, isActive: true }).sort({
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

  const count = await ListeningQuestion.countDocuments({ type: normalizedType, isActive: true });
  if (count === 0) {
    res.status(404).json({ success: false, message: 'No active questions available.' });
    return;
  }

  const skip = Math.floor(Math.random() * count);
  const question = await ListeningQuestion.findOne({
    type: normalizedType,
    isActive: true,
  }).skip(skip);
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

  const question = await ListeningQuestion.findOne({
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
  // Body validated by evaluateListeningSchema.
  const { questionId, questionType, answer, answers } = req.body as {
    questionId: string;
    questionType: ListeningQuestionType;
    answer?: string | number | Array<string | number>;
    answers?: string | number | Array<string | number>;
  };

  const question = await ListeningQuestion.findOne({
    _id: questionId,
    type: questionType,
    isActive: true,
  });
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  // Accept either `answer` or `answers`; the scorer coerces per type. Arrays are
  // passed through (mcq_multiple, fill_blanks, highlight_incorrect); a scalar is
  // normalised to a string for the single-select / text types.
  const raw = (answer !== undefined ? answer : answers) ?? '';
  const normalizedAnswer: string | Array<string | number> = Array.isArray(raw) ? raw : String(raw);

  const result = calculateListeningScore(questionType, normalizedAnswer, question);

  await applyAttempt(question, result.finalScore);
  await updateStudentStats(req.user!.userId);

  res.status(200).json({
    success: true,
    message: 'Answer evaluated successfully.',
    data: result,
  });
}
