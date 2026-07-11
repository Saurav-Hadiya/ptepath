import type { SpeakingQuestionType } from '@/types';

const SPEAKING_TYPE_VALUES: SpeakingQuestionType[] = [
  'read_aloud',
  'repeat_sentence',
  'describe_image',
  'respond_situation',
  'answer_short',
];

/**
 * Per-type configuration for the admin Speaking question bank.
 * Numeric bounds mirror backend/src/validators/speaking.validators.ts exactly:
 * speakingTime: int, min 1, max 3600. preparationTime: int, min 0, max 3600.
 */
export interface SpeakingTypeConfig {
  type: SpeakingQuestionType;
  label: string;
  description: string;
  contentLabel: string;
  hasPreparationTime: boolean;
  defaultSpeakingTime: number;
  defaultPreparationTime: number;
  hint?: string;
}

export const SPEAKING_TYPES: SpeakingTypeConfig[] = [
  {
    type: 'read_aloud',
    label: 'Read Aloud',
    description: 'Student reads a passage aloud within a time limit.',
    contentLabel: 'Passage Text',
    hasPreparationTime: true,
    defaultSpeakingTime: 40,
    defaultPreparationTime: 30,
  },
  {
    type: 'repeat_sentence',
    label: 'Repeat Sentence',
    description: 'Student repeats a sentence spoken by the browser.',
    contentLabel: 'Sentence to Read Aloud',
    hasPreparationTime: false,
    defaultSpeakingTime: 15,
    defaultPreparationTime: 0,
    hint: "This will be read aloud to the student by the browser's text-to-speech.",
  },
  {
    type: 'describe_image',
    label: 'Describe Image',
    description: 'Student describes an image shown on screen.',
    contentLabel: 'Image',
    hasPreparationTime: true,
    defaultSpeakingTime: 40,
    defaultPreparationTime: 25,
  },
  {
    type: 'respond_situation',
    label: 'Respond to Situation',
    description: 'Student responds verbally to a described situation.',
    contentLabel: 'Situation Description',
    hasPreparationTime: true,
    defaultSpeakingTime: 40,
    defaultPreparationTime: 30,
  },
  {
    type: 'answer_short',
    label: 'Answer Short Question',
    description: 'Student answers a short spoken question in a word or two.',
    contentLabel: 'Question Text (read aloud to the student)',
    hasPreparationTime: false,
    defaultSpeakingTime: 10,
    defaultPreparationTime: 0,
  },
];

export function getSpeakingTypeConfig(type: string): SpeakingTypeConfig | undefined {
  const normalized = type.replace(/-/g, '_');
  return SPEAKING_TYPES.find((t) => t.type === normalized);
}

export function isValidSpeakingType(type: string): boolean {
  return (SPEAKING_TYPE_VALUES as readonly string[]).includes(type.replace(/-/g, '_'));
}

export const SPEAKING_TIME_BOUNDS = { min: 1, max: 3600 };
export const PREPARATION_TIME_BOUNDS = { min: 0, max: 3600 };
