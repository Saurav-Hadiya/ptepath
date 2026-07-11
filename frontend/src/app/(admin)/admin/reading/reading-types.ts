import type { ReadingQuestionType } from '@/types';

const READING_TYPE_VALUES: ReadingQuestionType[] = [
  'rw_fill_blanks',
  'mcq_multiple',
  'reorder_paragraphs',
  'reading_fill_blanks',
  'mcq_single',
];

export interface ReadingTypeConfig {
  type: ReadingQuestionType;
  label: string;
  description: string;
}

export const READING_TYPES: ReadingTypeConfig[] = [
  {
    type: 'rw_fill_blanks',
    label: 'R&W Fill in the Blanks',
    description: 'Student picks the correct word for each blank from a shared word bank.',
  },
  {
    type: 'mcq_multiple',
    label: 'MCQ Multiple Answers',
    description: 'Student selects every correct answer from a list of options.',
  },
  {
    type: 'reorder_paragraphs',
    label: 'Re-order Paragraphs',
    description: 'Student drags shuffled paragraphs back into their correct order.',
  },
  {
    type: 'reading_fill_blanks',
    label: 'Reading Fill in the Blanks',
    description: 'Student chooses the correct word for each blank from a dropdown of options.',
  },
  {
    type: 'mcq_single',
    label: 'MCQ Single Answer',
    description: 'Student selects the one correct answer from a list of options.',
  },
];

export function getReadingTypeConfig(type: string): ReadingTypeConfig | undefined {
  const normalized = type.replace(/-/g, '_');
  return READING_TYPES.find((t) => t.type === normalized);
}

export function isValidReadingType(type: string): boolean {
  return (READING_TYPE_VALUES as readonly string[]).includes(type.replace(/-/g, '_'));
}
