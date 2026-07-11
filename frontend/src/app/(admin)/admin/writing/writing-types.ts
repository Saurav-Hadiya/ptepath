import type { WritingQuestionType } from '@/types';

const WRITING_TYPE_VALUES: WritingQuestionType[] = ['summarise_written_text', 'write_essay'];

/**
 * Per-type configuration for the admin Writing question bank.
 * wordMin/wordMax and default time limits mirror
 * backend/src/controllers/writing.controller.ts TYPE_CONFIG exactly — these are
 * server-derived and never editable by the admin, shown here as informational text only.
 * timeLimit bounds mirror backend/src/validators/writing.validators.ts (1-3600 seconds).
 */
export interface WritingTypeConfig {
  type: WritingQuestionType;
  label: string;
  description: string;
  contentLabel: string;
  wordMin: number;
  wordMax: number;
  defaultTimeLimitSeconds: number;
}

export const WRITING_TYPES: WritingTypeConfig[] = [
  {
    type: 'summarise_written_text',
    label: 'Summarise Written Text',
    description: 'Student summarises a passage in one sentence.',
    contentLabel: 'Passage Text',
    wordMin: 5,
    wordMax: 75,
    defaultTimeLimitSeconds: 600,
  },
  {
    type: 'write_essay',
    label: 'Write Essay',
    description: 'Student writes a full essay responding to a prompt.',
    contentLabel: 'Essay Prompt',
    wordMin: 200,
    wordMax: 300,
    defaultTimeLimitSeconds: 1200,
  },
];

export function getWritingTypeConfig(type: string): WritingTypeConfig | undefined {
  const normalized = type.replace(/-/g, '_');
  return WRITING_TYPES.find((t) => t.type === normalized);
}

export function isValidWritingType(type: string): boolean {
  return (WRITING_TYPE_VALUES as readonly string[]).includes(type.replace(/-/g, '_'));
}

/** Backend bounds (seconds) — the form input works in minutes derived from these. */
export const TIME_LIMIT_SECONDS_BOUNDS = { min: 1, max: 3600 };
export const TIME_LIMIT_MINUTES_BOUNDS = { min: 1, max: 60 };
