import { z } from 'zod';

/**
 * Validation schemas for the Writing module.
 *
 * Admin create/update arrive as JSON; evaluate routes send JSON too. Every
 * field is coerced, trimmed and bounded BEFORE it reaches the controller or
 * Mongoose — no NaN casts, no negatives, no empty required fields, and clean
 * 400 messages instead of 500 crashes.
 */

const WRITING_TYPES = ['summarise_written_text', 'write_essay'] as const;

/** Max length of a student's written response — generous upper bound to stop abuse. */
const MAX_RESPONSE_LENGTH = 20000;
/** Max length of an admin-supplied passage/prompt. */
const MAX_CONTENT_LENGTH = 10000;

/** '', null, undefined → undefined (treated as "not provided"). */
const emptyToUndefined = (v: unknown): unknown =>
  v === '' || v === null || v === undefined ? undefined : v;

/** Convert a value to a number, leaving non-numeric input intact so z.number rejects it. */
const toNumber = (v: unknown): unknown => {
  if (v === '' || v === null || v === undefined) return undefined;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
};

/** Accept canonical, hyphenated and short forms; normalise to the DB enum. */
const TYPE_ALIASES: Record<string, (typeof WRITING_TYPES)[number]> = {
  summarise: 'summarise_written_text',
  summarise_written_text: 'summarise_written_text',
  swt: 'summarise_written_text',
  essay: 'write_essay',
  write_essay: 'write_essay',
  we: 'write_essay',
};

const writingType = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  return TYPE_ALIASES[v.trim().toLowerCase().replace(/-/g, '_')] ?? v;
}, z.enum(WRITING_TYPES, { error: 'A valid question type is required.' }));

const contentRequired = z.preprocess(
  emptyToUndefined,
  z
    .string({ error: 'content is required.' })
    .trim()
    .min(1, 'content cannot be empty.')
    .max(MAX_CONTENT_LENGTH, `content must be ${MAX_CONTENT_LENGTH} characters or fewer.`)
);

const contentOptional = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .min(1, 'content cannot be empty.')
    .max(MAX_CONTENT_LENGTH, `content must be ${MAX_CONTENT_LENGTH} characters or fewer.`)
    .optional()
);

const timeLimitSchema = z
  .number({ error: 'timeLimit must be a valid number.' })
  .int('timeLimit must be a whole number.')
  .min(1, 'timeLimit must be 1 second or greater.')
  .max(3600, 'timeLimit must be 3600 seconds or fewer.');

const objectId = z
  .string({ error: 'questionId is required.' })
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID format.');

// ─── Admin: create / update / toggle ────────────────────────────────────────

export const createWritingQuestionSchema = z.object({
  type: writingType,
  content: contentRequired,
  timeLimit: z.preprocess(toNumber, timeLimitSchema.optional()),
});

export const updateWritingQuestionSchema = z
  .object({
    content: contentOptional,
    timeLimit: z.preprocess(toNumber, timeLimitSchema.optional()),
  })
  .refine((data) => data.content !== undefined || data.timeLimit !== undefined, {
    message: 'At least one field (content or timeLimit) must be provided to update.',
  });

export const toggleWritingStatusSchema = z.object({
  isActive: z.boolean({ error: 'isActive must be a boolean (true or false).' }),
});

// ─── Student: evaluate ───────────────────────────────────────────────────────

export const evaluateWritingSchema = z.object({
  questionId: objectId,
  responseText: z.preprocess(
    emptyToUndefined,
    z
      .string({ error: 'responseText is required.' })
      .trim()
      .min(1, 'responseText cannot be empty.')
      .max(MAX_RESPONSE_LENGTH, `responseText must be ${MAX_RESPONSE_LENGTH} characters or fewer.`)
  ),
});

export const WRITING_TYPE_VALUES = WRITING_TYPES;

export type CreateWritingQuestionInput = z.infer<typeof createWritingQuestionSchema>;
export type UpdateWritingQuestionInput = z.infer<typeof updateWritingQuestionSchema>;
export type EvaluateWritingInput = z.infer<typeof evaluateWritingSchema>;
