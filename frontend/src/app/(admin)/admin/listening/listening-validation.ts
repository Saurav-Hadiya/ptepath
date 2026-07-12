import type { AdminListeningQuestion, ListeningQuestionType } from '@/types';
import type { EditableOption } from '@/components/admin/OptionsListEditor';
import type { AdminListeningFormInput } from '@/services/admin-listening.service';

/** Mirrors backend/src/validators/listening.validators.ts listeningTypeError() exactly. */

const OPTION_TYPES: ListeningQuestionType[] = ['mcq_multiple', 'mcq_single', 'highlight_summary', 'select_missing'];
const QUESTION_TYPES: ListeningQuestionType[] = ['mcq_multiple', 'mcq_single'];
const TRANSCRIPT_TYPES: ListeningQuestionType[] = ['fill_blanks', 'highlight_incorrect'];

export interface ListeningFormState {
  type: ListeningQuestionType;
  question: string;
  options: EditableOption[];
  transcript: string;
  /** fill_blanks — one correct word per detected [BLANK] marker. */
  blankAnswers: string[];
  incorrectWordIndices: number[];
  correctSentence: string;
  audioFile: File | null;
  existingAudioUrl: string | null;
}

export function detectBlankCount(transcript: string): number {
  return (transcript.match(/\[BLANK\]/g) ?? []).length;
}

/** Converts a fetched question (edit mode) into editable form state. */
export function toListeningFormState(question: AdminListeningQuestion): ListeningFormState {
  const base = emptyListeningForm(question.type);
  base.question = question.question ?? '';
  base.transcript = question.transcript ?? '';
  base.correctSentence = question.correctSentence ?? '';
  base.existingAudioUrl = question.audioUrl;

  if (question.options.length) {
    base.options = question.options.map((o) => ({ label: o.label, text: o.text, isCorrect: o.isCorrect }));
  }
  if (question.type === 'fill_blanks') {
    base.blankAnswers = question.blanks.map((b) => b.correctWord);
  }
  if (question.type === 'highlight_incorrect') {
    base.incorrectWordIndices = question.incorrectWordIndices;
  }

  return base;
}

export function emptyListeningForm(type: ListeningQuestionType): ListeningFormState {
  return {
    type,
    question: '',
    options: [
      { label: 'A', text: '', isCorrect: false },
      { label: 'B', text: '', isCorrect: false },
    ],
    transcript: '',
    blankAnswers: [],
    incorrectWordIndices: [],
    correctSentence: '',
    audioFile: null,
    existingAudioUrl: null,
  };
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

function singleCorrectError(options: EditableOption[]): string | null {
  if (options.length < 2) return 'At least 2 options are required.';
  if (options.some((o) => !o.text.trim())) return 'Every option needs text.';
  if (hasDuplicateLabels(options)) return 'Option labels must be unique.';
  if (options.filter((o) => o.isCorrect).length !== 1) return 'Exactly one option must be marked correct.';
  return null;
}

export function validateListeningForm(state: ListeningFormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!state.audioFile && !state.existingAudioUrl) {
    errors.audio = 'An audio file is required.';
  }

  switch (state.type) {
    case 'summarise_spoken':
      break;
    case 'mcq_multiple': {
      if (!state.question.trim()) errors.question = 'Question text is required for this question type.';
      if (state.options.length < 2) errors.options = 'At least 2 options are required.';
      else if (state.options.some((o) => !o.text.trim())) errors.options = 'Every option needs text.';
      else if (hasDuplicateLabels(state.options)) errors.options = 'Option labels must be unique.';
      else if (!state.options.some((o) => o.isCorrect)) errors.options = 'At least one option must be marked correct.';
      break;
    }
    case 'mcq_single': {
      if (!state.question.trim()) errors.question = 'Question text is required for this question type.';
      const optErr = singleCorrectError(state.options);
      if (optErr) errors.options = optErr;
      break;
    }
    case 'highlight_summary':
    case 'select_missing': {
      const optErr = singleCorrectError(state.options);
      if (optErr) errors.options = optErr;
      break;
    }
    case 'fill_blanks': {
      if (!state.transcript.trim()) {
        errors.transcript = 'A transcript is required for this question type.';
        break;
      }
      const blankCount = detectBlankCount(state.transcript);
      if (blankCount < 1) {
        errors.transcript = 'Type [BLANK] in the transcript to mark at least one blank.';
        break;
      }
      for (let i = 0; i < blankCount; i += 1) {
        if (!(state.blankAnswers[i] ?? '').trim()) {
          errors.blanks = 'Enter a correct word for every blank.';
          break;
        }
      }
      break;
    }
    case 'highlight_incorrect': {
      if (!state.transcript.trim()) {
        errors.transcript = 'A transcript is required for this question type.';
        break;
      }
      if (state.incorrectWordIndices.length < 1) {
        errors.incorrectWordIndices = 'Click at least one word in the transcript that differs from the audio.';
      }
      break;
    }
    case 'write_dictation': {
      if (!state.correctSentence.trim()) errors.correctSentence = 'correctSentence is required for this question type.';
      break;
    }
  }

  return errors;
}

/** Converts validated form state into the multipart-ready payload the admin-listening service expects. */
export function buildListeningPayload(state: ListeningFormState): AdminListeningFormInput {
  const base: AdminListeningFormInput = {
    type: state.type,
    audioFile: state.audioFile,
  };

  if (QUESTION_TYPES.includes(state.type)) base.question = state.question.trim();
  if (OPTION_TYPES.includes(state.type)) {
    base.options = state.options.map((o) => ({ label: o.label, text: o.text.trim(), isCorrect: o.isCorrect }));
  }
  if (TRANSCRIPT_TYPES.includes(state.type)) base.transcript = state.transcript.trim();
  if (state.type === 'fill_blanks') {
    const blankCount = detectBlankCount(state.transcript);
    base.blanks = Array.from({ length: blankCount }, (_, i) => ({
      position: i,
      correctWord: (state.blankAnswers[i] ?? '').trim(),
    }));
  }
  if (state.type === 'highlight_incorrect') base.incorrectWordIndices = state.incorrectWordIndices;
  if (state.type === 'write_dictation') base.correctSentence = state.correctSentence.trim();

  return base;
}
