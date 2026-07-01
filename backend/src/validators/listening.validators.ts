import { z } from 'zod';
import { ListeningQuestionType } from '../types';

/**
 * Validation schemas for the Listening module.
 *
 * Create/update questions arrive as multipart/form-data (audio file upload), so
 * every non-file field is a raw string — arrays/objects come through as JSON
 * strings. These schemas coerce, trim and bound every value BEFORE it reaches
 * the controller or Mongoose. Per-type semantic rules (which fields are required
 * for which type, option/blank counts, exactly-one-correct, etc.) live in
 * `listeningTypeError` so they are shared by BOTH create (full type known) and
 * update (type taken from the existing document).
 */

const LISTENING_TYPES = [
  'summarise_spoken',
  'mcq_multiple',
  'fill_blanks',
  'highlight_summary',
  'mcq_single',
  'select_missing',
  'highlight_incorrect',
  'write_dictation',
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

const toBoolean = (v: unknown): unknown => {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === '1' || v === 1) return true;
  if (v === 'false' || v === '0' || v === 0) return false;
  if (v === undefined || v === null || v === '') return false;
  return v;
};

/** Arrays of objects/numbers arrive as JSON strings under multipart — parse them. */
const toJsonArray = (v: unknown): unknown => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed === '') return undefined;
    try {
      return JSON.parse(trimmed);
    } catch {
      return v; // leave intact so the array validator produces a clean error
    }
  }
  if (v === null || v === undefined) return undefined;
  return v;
};

/**
 * Handles number-index arrays that may arrive as:
 *   - actual array:          [1, 5]
 *   - JSON string:           "[1,5]"
 *   - comma-separated string: "1,5"  ← curl/Postman form-data default
 */
const toNumberArray = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(Number);
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed === '') return undefined;
    // Try JSON first so "[1,5]" works too.
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(Number);
    } catch {
      // Not JSON — fall back to comma-separated "1,5".
    }
    return trimmed.split(',').map((s) => Number(s.trim()));
  }
  if (v === null || v === undefined) return undefined;
  return v;
};

const listeningType = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  return v.trim().toLowerCase().replace(/-/g, '_');
}, z.enum(LISTENING_TYPES, { error: 'A valid question type is required.' }));

// playLimit: 1 = play once (default), 0 = unlimited.
const playLimitOptional = z.preprocess(
  toNumber,
  z
    .number({ error: 'playLimit must be a number.' })
    .int('playLimit must be a whole number.')
    .refine((n) => n === 0 || n === 1, 'playLimit must be 0 (unlimited) or 1 (play once).')
    .optional()
);

const questionOptional = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, 'question cannot be empty.').max(2000, 'question is too long.').optional()
);

const transcriptOptional = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, 'transcript cannot be empty.').max(20000, 'transcript is too long.').optional()
);

const correctSentenceOptional = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .min(1, 'correctSentence cannot be empty.')
    .max(2000, 'correctSentence is too long.')
    .optional()
);

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

const blankSchema = z.object({
  position: z.preprocess(
    toNumber,
    z.number({ error: 'Each blank needs a numeric position.' }).int().min(0)
  ),
  correctWord: z.preprocess(
    emptyToUndefined,
    z.string({ error: 'Each blank needs a correctWord.' }).trim().min(1, 'Each blank needs a correctWord.')
  ),
});

const optionsOptional = z.preprocess(toJsonArray, z.array(optionSchema).optional());
const blanksOptional = z.preprocess(toJsonArray, z.array(blankSchema).optional());
const incorrectWordIndicesOptional = z.preprocess(
  toNumberArray,
  z.array(z.number({ error: 'Word indices must be numbers.' }).int().min(0)).optional()
);

const objectId = z
  .string({ error: 'questionId is required.' })
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID format.');

// ─── Shared per-type semantic validation ─────────────────────────────────────

export interface ListeningPayload {
  question?: string;
  options?: Array<{ label: string; text: string; isCorrect: boolean }>;
  transcript?: string;
  blanks?: Array<{ position: number; correctWord: string }>;
  incorrectWordIndices?: number[];
  correctSentence?: string;
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

/** Validate options for a single-correct type (mcq_single, highlight_summary, select_missing). */
function singleCorrectError(options?: ListeningPayload['options']): string | null {
  if (!options || options.length < 2) return 'At least 2 options are required.';
  if (hasDuplicateLabels(options)) return 'Option labels must be unique.';
  if (options.filter((o) => o.isCorrect).length !== 1) {
    return 'Exactly one option must be marked correct.';
  }
  return null;
}

/**
 * Returns an error message if the payload is invalid for the given type, else
 * null. Assumes the payload already passed structural (zod) validation.
 */
export function listeningTypeError(
  type: ListeningQuestionType,
  data: ListeningPayload
): string | null {
  switch (type) {
    case 'summarise_spoken':
      // Open-ended — no extra fields required beyond the audio file.
      return null;
    case 'mcq_multiple': {
      if (!data.question) return 'Question text is required for this question type.';
      if (!data.options || data.options.length < 2) return 'At least 2 options are required.';
      if (hasDuplicateLabels(data.options)) return 'Option labels must be unique.';
      if (!data.options.some((o) => o.isCorrect)) return 'At least one option must be marked correct.';
      return null;
    }
    case 'mcq_single': {
      if (!data.question) return 'Question text is required for this question type.';
      return singleCorrectError(data.options);
    }
    case 'highlight_summary':
    case 'select_missing':
      return singleCorrectError(data.options);
    case 'fill_blanks': {
      if (!data.transcript) return 'A transcript is required for this question type.';
      if (!data.blanks || data.blanks.length < 1) return 'At least one blank is required.';
      return null;
    }
    case 'highlight_incorrect': {
      if (!data.transcript) return 'A transcript is required for this question type.';
      if (!data.incorrectWordIndices || data.incorrectWordIndices.length < 1) {
        return 'At least one incorrect word index is required.';
      }
      const wordCount = data.transcript.trim().split(/\s+/).filter(Boolean).length;
      if (data.incorrectWordIndices.some((i) => i >= wordCount)) {
        return 'Each incorrect word index must fall within the transcript.';
      }
      if (new Set(data.incorrectWordIndices).size !== data.incorrectWordIndices.length) {
        return 'Incorrect word indices must be unique.';
      }
      return null;
    }
    case 'write_dictation': {
      if (!data.correctSentence) return 'correctSentence is required for this question type.';
      return null;
    }
    default:
      return 'A valid question type is required.';
  }
}

// ─── Admin: create / update / toggle ────────────────────────────────────────

export const createListeningQuestionSchema = z
  .object({
    type: listeningType,
    playLimit: playLimitOptional,
    question: questionOptional,
    options: optionsOptional,
    transcript: transcriptOptional,
    blanks: blanksOptional,
    incorrectWordIndices: incorrectWordIndicesOptional,
    correctSentence: correctSentenceOptional,
  })
  .superRefine((data, ctx) => {
    const message = listeningTypeError(data.type, data);
    if (message) ctx.addIssue({ code: 'custom', message });
  });

// No "at least one field" refine — an audio-only update (new file, no body
// fields) is valid. Per-type invariants are re-checked in the controller
// against the merged candidate.
export const updateListeningQuestionSchema = z.object({
  playLimit: playLimitOptional,
  question: questionOptional,
  options: optionsOptional,
  transcript: transcriptOptional,
  blanks: blanksOptional,
  incorrectWordIndices: incorrectWordIndicesOptional,
  correctSentence: correctSentenceOptional,
});

export const toggleListeningStatusSchema = z.object({
  isActive: z.preprocess(
    (v) => (typeof v === 'boolean' ? v : toBoolean(v)),
    z.boolean({ error: 'isActive must be a boolean (true or false).' })
  ),
});

// ─── Student: evaluate ───────────────────────────────────────────────────────

export const evaluateListeningSchema = z
  .object({
    questionId: objectId,
    questionType: listeningType,
    // Array types send `answer`/`answers`; single-select types may send a string.
    // highlight_incorrect sends a number array.
    answer: z.union([z.array(z.union([z.string(), z.number()])), z.string(), z.number()]).optional(),
    answers: z.union([z.array(z.union([z.string(), z.number()])), z.string(), z.number()]).optional(),
  })
  .refine((data) => data.answer !== undefined || data.answers !== undefined, {
    message: 'answer is required.',
    path: ['answer'],
  });

export const LISTENING_TYPE_VALUES = LISTENING_TYPES;

export type CreateListeningQuestionInput = z.infer<typeof createListeningQuestionSchema>;
export type UpdateListeningQuestionInput = z.infer<typeof updateListeningQuestionSchema>;
export type EvaluateListeningInput = z.infer<typeof evaluateListeningSchema>;
