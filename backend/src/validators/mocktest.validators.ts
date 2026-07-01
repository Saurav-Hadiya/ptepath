import { z } from 'zod';
import { MockTestModule } from '../models/mocktest-template.model';

/**
 * Validation schemas for the Mock Test module.
 *
 * Bodies arrive as JSON. zod handles structural shape + coercion. The one
 * cross-field rule (a rule's `type` must be a valid question type for its
 * `module`) lives in `VALID_TYPES_BY_MODULE` and is enforced via superRefine so
 * it can be reused by both create and update.
 */

/** Minimum total time a template may declare (minutes). */
const MIN_TOTAL_TIME = 10;

/** Question types allowed per module — mirrors each module's DB enum. */
export const VALID_TYPES_BY_MODULE: Record<MockTestModule, readonly string[]> = {
  speaking: ['read_aloud', 'repeat_sentence', 'describe_image', 'respond_situation', 'answer_short'],
  writing: ['summarise_written_text', 'write_essay'],
  reading: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'],
  listening: [
    'summarise_spoken',
    'mcq_multiple',
    'fill_blanks',
    'highlight_summary',
    'mcq_single',
    'select_missing',
    'highlight_incorrect',
    'write_dictation',
  ],
} as const;

const MODULES = ['speaking', 'writing', 'reading', 'listening'] as const;

const toNumber = (v: unknown): unknown => {
  if (v === '' || v === null || v === undefined) return undefined;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
};

const emptyToUndefined = (v: unknown): unknown =>
  v === '' || v === null || v === undefined ? undefined : v;

// ─── Shared field schemas ────────────────────────────────────────────────────

const nameRequired = z.preprocess(
  emptyToUndefined,
  z.string({ error: 'name is required.' }).trim().min(1, 'name cannot be empty.').max(120, 'name is too long.')
);
const nameOptional = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, 'name cannot be empty.').max(120, 'name is too long.').optional()
);
const descriptionRequired = z.preprocess(
  emptyToUndefined,
  z.string({ error: 'description is required.' }).trim().min(1, 'description cannot be empty.').max(1000, 'description is too long.')
);
const descriptionOptional = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, 'description cannot be empty.').max(1000, 'description is too long.').optional()
);

const totalTimeRequired = z.preprocess(
  toNumber,
  z
    .number({ error: 'totalTime is required and must be a number.' })
    .int('totalTime must be a whole number of minutes.')
    .min(MIN_TOTAL_TIME, `totalTime must be at least ${MIN_TOTAL_TIME} minutes.`)
    .max(600, 'totalTime is too long.')
);
const totalTimeOptional = z.preprocess(
  toNumber,
  z
    .number()
    .int('totalTime must be a whole number of minutes.')
    .min(MIN_TOTAL_TIME, `totalTime must be at least ${MIN_TOTAL_TIME} minutes.`)
    .max(600, 'totalTime is too long.')
    .optional()
);

const questionRuleSchema = z.object({
  module: z.enum(MODULES, { error: 'Each rule needs a valid module.' }),
  type: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/-/g, '_') : v),
    z.string({ error: 'Each rule needs a question type.' }).min(1, 'Each rule needs a question type.')
  ),
  count: z.preprocess(
    toNumber,
    z.number({ error: 'Each rule needs a count.' }).int('count must be a whole number.').min(1, 'count must be at least 1.')
  ),
});

const questionRulesRequired = z
  .array(questionRuleSchema, { error: 'questionRules is required.' })
  .min(1, 'At least one question rule is required.');

/** Adds an issue for any rule whose `type` is not valid for its `module`. */
function refineRuleTypes(
  rules: Array<{ module: MockTestModule; type: string }>,
  ctx: z.RefinementCtx
): void {
  rules.forEach((rule, i) => {
    const allowed = VALID_TYPES_BY_MODULE[rule.module];
    if (!allowed.includes(rule.type)) {
      ctx.addIssue({
        code: 'custom',
        message: `"${rule.type}" is not a valid ${rule.module} question type.`,
        path: ['questionRules', i, 'type'],
      });
    }
  });
}

// ─── Admin: create / update / toggle ─────────────────────────────────────────

export const createMockTestSchema = z
  .object({
    name: nameRequired,
    description: descriptionRequired,
    totalTime: totalTimeRequired,
    questionRules: questionRulesRequired,
  })
  .superRefine((data, ctx) => refineRuleTypes(data.questionRules, ctx));

export const updateMockTestSchema = z
  .object({
    name: nameOptional,
    description: descriptionOptional,
    totalTime: totalTimeOptional,
    questionRules: questionRulesRequired.optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.totalTime !== undefined ||
      data.questionRules !== undefined,
    { message: 'At least one field must be provided to update.' }
  )
  .superRefine((data, ctx) => {
    if (data.questionRules) refineRuleTypes(data.questionRules, ctx);
  });

export const toggleMockTestStatusSchema = z.object({
  isActive: z.boolean({ error: 'isActive must be a boolean (true or false).' }),
});

// ─── Student: submit ─────────────────────────────────────────────────────────

const submitAnswerSchema = z
  .object({
    questionId: z.string({ error: 'Each answer needs a questionId.' }).trim().min(1, 'Each answer needs a questionId.'),
    module: z.enum(MODULES, { error: 'Each answer needs a valid module.' }),
    questionType: z.preprocess(
      (v) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/-/g, '_') : v),
      z.string({ error: 'Each answer needs a questionType.' }).min(1, 'Each answer needs a questionType.')
    ),
    // Raw answer for non-speaking questions (string / string[] / number[] / null).
    answer: z.any().optional(),
    // Pre-scored value for speaking questions; null when skipped / timed out.
    score: z.preprocess(toNumber, z.number().min(0).max(100)).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const allowed = VALID_TYPES_BY_MODULE[data.module];
    if (!allowed.includes(data.questionType)) {
      ctx.addIssue({
        code: 'custom',
        message: `"${data.questionType}" is not a valid ${data.module} question type.`,
        path: ['questionType'],
      });
    }
  });

export const submitMockTestSchema = z.object({
  // Empty arrays are valid — every question then scores 0.
  answers: z.array(submitAnswerSchema, { error: 'answers must be an array.' }),
  timeTaken: z.preprocess(toNumber, z.number().min(0).max(600)).optional(),
});

export type CreateMockTestInput = z.infer<typeof createMockTestSchema>;
export type UpdateMockTestInput = z.infer<typeof updateMockTestSchema>;
export type SubmitMockTestInput = z.infer<typeof submitMockTestSchema>;
