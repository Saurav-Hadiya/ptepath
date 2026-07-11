import type { AdminReadingQuestion, ReadingQuestionType } from '@/types';
import type { EditableOption } from '@/components/admin/OptionsListEditor';
import type { AdminReadingFormInput } from '@/services/admin-reading.service';

/** Mirrors backend/src/validators/reading.validators.ts readingTypeError() exactly. */

export interface ReadingParagraphDraft {
  label: string;
  text: string;
}

export interface ReadingFillBlankDraft {
  correctAnswer: string;
  wrongOptions: string[];
}

export interface ReadingFormState {
  type: ReadingQuestionType;
  passage: string;
  question: string;
  wordPool: string[];
  /** rw_fill_blanks — one correct-answer selection per detected [BLANK] marker. */
  blankAnswers: string[];
  /** reading_fill_blanks — one correctAnswer + wrong options per detected [BLANK] marker. */
  readingBlanks: ReadingFillBlankDraft[];
  options: EditableOption[];
  paragraphs: ReadingParagraphDraft[];
}

/** Counts [BLANK] markers in the passage — used to auto-detect blank count. */
export function detectBlankCount(passage: string): number {
  return (passage.match(/\[BLANK\]/g) ?? []).length;
}

/** Converts a fetched question (edit mode) into editable form state. */
export function toReadingFormState(question: AdminReadingQuestion): ReadingFormState {
  const base = emptyReadingForm(question.type);
  base.passage = question.passage;
  base.question = question.question ?? '';
  base.wordPool = question.wordPool.length ? question.wordPool : [];

  if (question.type === 'rw_fill_blanks') {
    base.blankAnswers = question.blanks.map((b) => b.correctAnswer);
  }
  if (question.type === 'reading_fill_blanks') {
    base.readingBlanks = question.blanks.map((b) => ({
      correctAnswer: b.correctAnswer,
      wrongOptions: b.options.filter((o) => o.trim().toLowerCase() !== b.correctAnswer.trim().toLowerCase()),
    }));
  }
  if (question.type === 'mcq_multiple' || question.type === 'mcq_single') {
    base.options = question.options.length
      ? question.options.map((o) => ({ label: o.label, text: o.text, isCorrect: o.isCorrect }))
      : base.options;
  }
  if (question.type === 'reorder_paragraphs') {
    base.paragraphs = question.paragraphs.length ? question.paragraphs : base.paragraphs;
  }

  return base;
}

export function emptyReadingForm(type: ReadingQuestionType): ReadingFormState {
  return {
    type,
    passage: '',
    question: '',
    wordPool: [],
    blankAnswers: [],
    readingBlanks: [],
    options: [
      { label: 'A', text: '', isCorrect: false },
      { label: 'B', text: '', isCorrect: false },
    ],
    paragraphs: [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
    ],
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

export function validateReadingForm(state: ReadingFormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!state.passage.trim()) {
    errors.passage = 'Passage is required.';
    return errors;
  }

  switch (state.type) {
    case 'rw_fill_blanks': {
      const blankCount = detectBlankCount(state.passage);
      const pool = state.wordPool.map((w) => w.trim()).filter(Boolean);
      if (pool.length < 1) {
        errors.wordPool = 'A word pool is required for this question type.';
      }
      if (blankCount < 1) {
        errors.passage = 'Type [BLANK] in the passage to mark at least one blank.';
      }
      const poolSet = new Set(pool.map((w) => w.toLowerCase()));
      for (let i = 0; i < blankCount; i += 1) {
        const answer = (state.blankAnswers[i] ?? '').trim();
        if (!answer) {
          errors.blanks = 'Select a correct answer for every blank.';
          break;
        }
        if (!poolSet.has(answer.toLowerCase())) {
          errors.blanks = `The correct answer "${answer}" must be present in the word pool.`;
          break;
        }
      }
      break;
    }
    case 'reading_fill_blanks': {
      const blankCount = detectBlankCount(state.passage);
      if (blankCount < 1) {
        errors.passage = 'Type [BLANK] in the passage to mark at least one blank.';
        break;
      }
      for (let i = 0; i < blankCount; i += 1) {
        const draft = state.readingBlanks[i];
        const correct = (draft?.correctAnswer ?? '').trim();
        const wrongCount = (draft?.wrongOptions ?? []).filter((w) => w.trim()).length;
        if (!correct) {
          errors.blanks = `Blank ${i + 1} needs a correct answer.`;
          break;
        }
        if (wrongCount < 1) {
          errors.blanks = `Blank ${i + 1} needs at least one wrong option.`;
          break;
        }
      }
      break;
    }
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
      if (state.options.length < 2) errors.options = 'At least 2 options are required.';
      else if (state.options.some((o) => !o.text.trim())) errors.options = 'Every option needs text.';
      else if (hasDuplicateLabels(state.options)) errors.options = 'Option labels must be unique.';
      else if (state.options.filter((o) => o.isCorrect).length !== 1) {
        errors.options = 'Exactly one option must be marked correct.';
      }
      break;
    }
    case 'reorder_paragraphs': {
      if (state.paragraphs.length < 3) errors.paragraphs = 'At least 3 paragraphs are required.';
      else if (state.paragraphs.some((p) => !p.text.trim())) errors.paragraphs = 'Every paragraph needs text.';
      else if (hasDuplicateLabels(state.paragraphs)) errors.paragraphs = 'Paragraph labels must be unique.';
      break;
    }
  }

  return errors;
}

/** Converts validated form state into the JSON body the admin-reading service expects. */
export function buildReadingPayload(state: ReadingFormState): AdminReadingFormInput {
  const base: AdminReadingFormInput = { type: state.type, passage: state.passage.trim() };

  switch (state.type) {
    case 'rw_fill_blanks': {
      const blankCount = detectBlankCount(state.passage);
      const pool = state.wordPool.map((w) => w.trim()).filter(Boolean);
      base.wordPool = pool;
      base.blanks = Array.from({ length: blankCount }, (_, i) => ({
        position: i,
        correctAnswer: (state.blankAnswers[i] ?? '').trim(),
        options: pool,
      }));
      break;
    }
    case 'reading_fill_blanks': {
      const blankCount = detectBlankCount(state.passage);
      base.blanks = Array.from({ length: blankCount }, (_, i) => {
        const draft = state.readingBlanks[i] ?? { correctAnswer: '', wrongOptions: [] };
        const correct = draft.correctAnswer.trim();
        const wrong = draft.wrongOptions.map((w) => w.trim()).filter(Boolean);
        return { position: i, correctAnswer: correct, options: [correct, ...wrong] };
      });
      break;
    }
    case 'mcq_multiple':
    case 'mcq_single': {
      base.question = state.question.trim();
      base.options = state.options.map((o) => ({ label: o.label, text: o.text.trim(), isCorrect: o.isCorrect }));
      break;
    }
    case 'reorder_paragraphs': {
      base.paragraphs = state.paragraphs.map((p) => ({ label: p.label, text: p.text.trim() }));
      break;
    }
  }

  return base;
}
