import { z } from 'zod';

/**
 * Validation schemas for the Speaking module.
 *
 * Create/update questions arrive as multipart/form-data, so every field is a
 * raw string (or absent). These schemas coerce, trim, and bound every value
 * BEFORE it reaches the controller or Mongoose — no NaN casts, no negatives,
 * no empty required fields, and clean 400 messages instead of 500 crashes.
 */

const SPEAKING_TYPES = [
  'read_aloud',
  'repeat_sentence',
  'describe_image',
  'respond_situation',
  'answer_short',
] as const;

const TEXT_CONTENT_TYPES = ['read_aloud', 'repeat_sentence', 'respond_situation', 'answer_short'];

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

/** acceptedAnswers may arrive as an array, a JSON array string, or comma-separated text. */
const toStringArray = (v: unknown): unknown => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed === '') return undefined;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not JSON — fall back to comma-separated.
    }
    return trimmed.split(',').map((s) => s.trim());
  }
  if (v === null || v === undefined) return undefined;
  return v;
};

// hyphenated URL/body values (read-aloud) are normalized to the DB enum (read_aloud).
const speakingType = z.preprocess(
  (v) => (typeof v === 'string' ? v.replace(/-/g, '_') : v),
  z.enum(SPEAKING_TYPES, { error: 'A valid question type is required.' })
);

const secondsSchema = (label: string, min: number) =>
  z
    .number({
      error: (issue) =>
        issue.input === undefined ? `${label} is required.` : `${label} must be a valid number.`,
    })
    .int(`${label} must be a whole number.`)
    .min(min, `${label} must be ${min} or greater.`)
    .max(3600, `${label} must be 3600 seconds or fewer.`);

const requiredSeconds = (label: string, min: number) => z.preprocess(toNumber, secondsSchema(label, min));
const optionalSeconds = (label: string, min: number) =>
  z.preprocess(toNumber, secondsSchema(label, min).optional());

const contentRequired = z.preprocess(
  emptyToUndefined,
  z.string({ error: 'content is required for this question type.' }).trim().min(1, 'content cannot be empty.')
);
const contentOptional = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, 'content cannot be empty.').optional()
);

const acceptedAnswersBase = z
  .array(z.string().trim().min(1, 'Accepted answers cannot be empty.'))
  .min(1, 'At least one accepted answer is required.');
const acceptedAnswersOptional = z.preprocess(toStringArray, acceptedAnswersBase.optional());

const objectId = z
  .string({ error: 'questionId is required.' })
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID format.');

// ─── Admin: create / update / toggle ────────────────────────────────────────

export const createSpeakingQuestionSchema = z
  .object({
    type: speakingType,
    content: contentOptional,
    speakingTime: requiredSeconds('speakingTime', 1),
    preparationTime: optionalSeconds('preparationTime', 0),
    acceptedAnswers: acceptedAnswersOptional,
  })
  .superRefine((data, ctx) => {
    if (TEXT_CONTENT_TYPES.includes(data.type) && !data.content) {
      ctx.addIssue({ code: 'custom', message: 'content is required for this question type.', path: ['content'] });
    }
    if (data.type === 'answer_short' && (!data.acceptedAnswers || data.acceptedAnswers.length < 1)) {
      ctx.addIssue({ code: 'custom', message: 'At least one accepted answer is required.', path: ['acceptedAnswers'] });
    }
  });

export const updateSpeakingQuestionSchema = z
  .object({
    content: contentOptional,
    speakingTime: optionalSeconds('speakingTime', 1),
    preparationTime: optionalSeconds('preparationTime', 0),
    acceptedAnswers: acceptedAnswersOptional,
  })
  .refine(
    (data) =>
      data.content !== undefined ||
      data.speakingTime !== undefined ||
      data.preparationTime !== undefined ||
      data.acceptedAnswers !== undefined,
    { message: 'At least one field must be provided to update.' }
  );

export const toggleSpeakingStatusSchema = z.object({
  isActive: z.boolean({ error: 'isActive must be a boolean (true or false).' }),
});

// ─── Student: evaluate ───────────────────────────────────────────────────────

export const evaluateSchema = z.object({
  questionId: objectId,
});

export const evaluateWithDurationSchema = z.object({
  questionId: objectId,
  recordingDuration: z.preprocess(
    toNumber,
    z
      .number({ error: 'recordingDuration must be a valid number.' })
      .positive('recordingDuration must be greater than 0.')
      .max(3600, 'recordingDuration must be 3600 seconds or fewer.')
      .optional()
  ),
});

// ─── Shared: type param / query ──────────────────────────────────────────────

export const SPEAKING_TYPE_VALUES = SPEAKING_TYPES;
export const requiredType = speakingType;

export type CreateSpeakingQuestionInput = z.infer<typeof createSpeakingQuestionSchema>;
export type UpdateSpeakingQuestionInput = z.infer<typeof updateSpeakingQuestionSchema>;
