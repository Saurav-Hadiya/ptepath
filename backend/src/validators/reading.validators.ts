import { z } from 'zod';
import { ReadingQuestionType } from '../types';

/**
 * Validation schemas for the Reading module.
 *
 * Bodies arrive as JSON. zod handles structural shape + coercion; the per-type
 * semantic rules (which fields are required for which type, option/blank counts,
 * exactly-one-correct, etc.) live in `readingTypeError` so they can be reused by
 * BOTH create (full type known) and update (type taken from the existing doc).
 */

const READING_TYPES = [
  'rw_fill_blanks',
  'mcq_multiple',
  'reorder_paragraphs',
  'reading_fill_blanks',
  'mcq_single',
] as const;

/** '', null, undefined → undefined (treated as "not provided"). */
const emptyToUndefined = (v: unknown): unknown =>
  v === '' || v === null || v === undefined ? undefined : v;

const toNumber = (v: unknown): unknown => {
  if (v === '' || v === null || v === undefined) return undefined;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
};

/** Coerce common truthy/falsey string forms to boolean; pass through real booleans. */
const toBoolean = (v: unknown): unknown => {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === '1' || v === 1) return true;
  if (v === 'false' || v === '0' || v === 0) return false;
  if (v === undefined || v === null || v === '') return false;
  return v;
};

const readingType = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  return v.trim().toLowerCase().replace(/-/g, '_');
}, z.enum(READING_TYPES, { error: 'A valid question type is required.' }));

const passageRequired = z.preprocess(
  emptyToUndefined,
  z.string({ error: 'passage is required.' }).trim().min(1, 'passage cannot be empty.').max(20000, 'passage is too long.')
);
const passageOptional = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, 'passage cannot be empty.').max(20000, 'passage is too long.').optional()
);
const questionOptional = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, 'question cannot be empty.').max(2000, 'question is too long.').optional()
);

const blankSchema = z.object({
  position: z.preprocess(toNumber, z.number({ error: 'Each blank needs a numeric position.' }).int().min(0)),
  correctAnswer: z.preprocess(
    emptyToUndefined,
    z.string({ error: 'Each blank needs a correctAnswer.' }).trim().min(1, 'Each blank needs a correctAnswer.')
  ),
  options: z
    .array(z.string().trim().min(1, 'Blank options cannot be empty.'))
    .min(2, 'Each blank needs at least 2 options.'),
});

const optionSchema = z.object({
  label: z.preprocess(
    emptyToUndefined,
    z.string({ error: 'Each option needs a label.' }).trim().min(1, 'Each option needs a label.')
  ),
  text: z.preprocess(
    emptyToUndefined,
    z.string({ error: 'Each option needs text.' }).trim().min(1, 'Each option needs text.')
  ),
  isCorrect: z.preprocess(toBoolean, z.boolean()),
});

const paragraphSchema = z.object({
  label: z.preprocess(
    emptyToUndefined,
    z.string({ error: 'Each paragraph needs a label.' }).trim().min(1, 'Each paragraph needs a label.')
  ),
  text: z.preprocess(
    emptyToUndefined,
    z.string({ error: 'Each paragraph needs text.' }).trim().min(1, 'Each paragraph needs text.')
  ),
});

const wordPoolSchema = z.array(z.string().trim().min(1, 'Word pool entries cannot be empty.'));

const objectId = z
  .string({ error: 'questionId is required.' })
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID format.');

// ─── Shared per-type semantic validation ─────────────────────────────────────

/** The structurally-validated payload shape the semantic checker inspects. */
export interface ReadingPayload {
  question?: string;
  blanks?: Array<{ position: number; correctAnswer: string; options: string[] }>;
  options?: Array<{ label: string; text: string; isCorrect: boolean }>;
  paragraphs?: Array<{ label: string; text: string }>;
  wordPool?: string[];
}

function hasDuplicateLabels(items: Array<{ label: string }>): boolean {
  const seen = new Set<string>();
  for (const item of items) {
    const key = item.label.trim().toLowerCase();
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

/**
 * Returns an error message if the payload is invalid for the given type, else
 * null. Assumes the payload already passed structural (zod) validation.
 */
export function readingTypeError(type: ReadingQuestionType, data: ReadingPayload): string | null {
  switch (type) {
    case 'rw_fill_blanks': {
      if (!data.wordPool || data.wordPool.length < 1) return 'A word pool is required for this question type.';
      if (!data.blanks || data.blanks.length < 1) return 'At least one blank is required.';
      const pool = new Set(data.wordPool.map((w) => w.trim().toLowerCase()));
      for (const b of data.blanks) {
        if (!pool.has(b.correctAnswer.trim().toLowerCase())) {
          return `The correct answer "${b.correctAnswer}" must be present in the word pool.`;
        }
      }
      return null;
    }
    case 'reading_fill_blanks': {
      if (!data.blanks || data.blanks.length < 1) return 'At least one blank is required.';
      for (const b of data.blanks) {
        const opts = b.options.map((o) => o.trim().toLowerCase());
        if (!opts.includes(b.correctAnswer.trim().toLowerCase())) {
          return `The correct answer "${b.correctAnswer}" must be one of that blank's options.`;
        }
      }
      return null;
    }
    case 'mcq_multiple': {
      if (!data.question) return 'Question text is required for this question type.';
      if (!data.options || data.options.length < 2) return 'At least 2 options are required.';
      if (hasDuplicateLabels(data.options)) return 'Option labels must be unique.';
      if (!data.options.some((o) => o.isCorrect)) return 'At least one option must be marked correct.';
      return null;
    }
    case 'mcq_single': {
      if (!data.question) return 'Question text is required for this question type.';
      if (!data.options || data.options.length < 2) return 'At least 2 options are required.';
      if (hasDuplicateLabels(data.options)) return 'Option labels must be unique.';
      if (data.options.filter((o) => o.isCorrect).length !== 1) {
        return 'Exactly one option must be marked correct.';
      }
      return null;
    }
    case 'reorder_paragraphs': {
      if (!data.paragraphs || data.paragraphs.length < 3) return 'At least 3 paragraphs are required.';
      if (hasDuplicateLabels(data.paragraphs)) return 'Paragraph labels must be unique.';
      return null;
    }
    default:
      return 'A valid question type is required.';
  }
}

// ─── Admin: create / update / toggle ────────────────────────────────────────

export const createReadingQuestionSchema = z
  .object({
    type: readingType,
    passage: passageRequired,
    question: questionOptional,
    blanks: z.array(blankSchema).optional(),
    options: z.array(optionSchema).optional(),
    paragraphs: z.array(paragraphSchema).optional(),
    wordPool: wordPoolSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const message = readingTypeError(data.type, data);
    if (message) ctx.addIssue({ code: 'custom', message });
  });

export const updateReadingQuestionSchema = z
  .object({
    passage: passageOptional,
    question: questionOptional,
    blanks: z.array(blankSchema).optional(),
    options: z.array(optionSchema).optional(),
    paragraphs: z.array(paragraphSchema).optional(),
    wordPool: wordPoolSchema.optional(),
  })
  .refine(
    (data) =>
      data.passage !== undefined ||
      data.question !== undefined ||
      data.blanks !== undefined ||
      data.options !== undefined ||
      data.paragraphs !== undefined ||
      data.wordPool !== undefined,
    { message: 'At least one field must be provided to update.' }
  );

export const toggleReadingStatusSchema = z.object({
  isActive: z.boolean({ error: 'isActive must be a boolean (true or false).' }),
});

// ─── Student: evaluate ───────────────────────────────────────────────────────

export const evaluateReadingSchema = z
  .object({
    questionId: objectId,
    questionType: readingType,
    // Array types send `answers`; mcq_single may send `answer` (string) or `answers`.
    answers: z.union([z.array(z.string()), z.string()]).optional(),
    answer: z.string().optional(),
  })
  .refine((data) => data.answers !== undefined || data.answer !== undefined, {
    message: 'answers is required.',
    path: ['answers'],
  });

export const READING_TYPE_VALUES = READING_TYPES;

export type CreateReadingQuestionInput = z.infer<typeof createReadingQuestionSchema>;
export type UpdateReadingQuestionInput = z.infer<typeof updateReadingQuestionSchema>;
export type EvaluateReadingInput = z.infer<typeof evaluateReadingSchema>;
