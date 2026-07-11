import type { ListeningQuestionType } from '@/types';

const LISTENING_TYPE_VALUES: ListeningQuestionType[] = [
  'summarise_spoken',
  'mcq_multiple',
  'fill_blanks',
  'highlight_summary',
  'mcq_single',
  'select_missing',
  'highlight_incorrect',
  'write_dictation',
];

export interface ListeningTypeConfig {
  type: ListeningQuestionType;
  label: string;
  description: string;
}

export const LISTENING_TYPES: ListeningTypeConfig[] = [
  {
    type: 'summarise_spoken',
    label: 'Summarise Spoken Text',
    description: 'Student listens to audio and writes a written summary.',
  },
  {
    type: 'mcq_multiple',
    label: 'MCQ Multiple Answers',
    description: 'Student listens to audio then selects every correct answer.',
  },
  {
    type: 'fill_blanks',
    label: 'Fill in the Blanks',
    description: 'Student types the missing word for each blank while listening to the audio.',
  },
  {
    type: 'highlight_summary',
    label: 'Highlight Correct Summary',
    description: 'Student listens to audio then selects the one summary that matches it.',
  },
  {
    type: 'mcq_single',
    label: 'MCQ Single Answer',
    description: 'Student listens to audio then selects the one correct answer.',
  },
  {
    type: 'select_missing',
    label: 'Select Missing Word',
    description: 'Student listens to audio that *BEEP* off and selects the missing final word.',
  },
  {
    type: 'highlight_incorrect',
    label: 'Highlight Incorrect Words',
    description: 'Student clicks the words in a transcript that differ from the audio.',
  },
  {
    type: 'write_dictation',
    label: 'Write from Dictation',
    description: 'Student listens to a short sentence and types exactly what they heard.',
  },
];

export function getListeningTypeConfig(type: string): ListeningTypeConfig | undefined {
  const normalized = type.replace(/-/g, '_');
  return LISTENING_TYPES.find((t) => t.type === normalized);
}

export function isValidListeningType(type: string): boolean {
  return (LISTENING_TYPE_VALUES as readonly string[]).includes(type.replace(/-/g, '_'));
}
