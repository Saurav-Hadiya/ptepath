import { ReadingQuestionType } from '../types';

/**
 * Reading module scoring — 100% rule-based, pure JavaScript. No AI, no packages.
 *
 * All sub-scores are percentages (0-100). displayScore is rendered on the real
 * PTE scale (out of 90): displayScore = Math.round(score × 0.90) + ' / 90'.
 *
 * Correct answers live in the DB and are revealed only in the score response
 * returned from here — never in the question-fetch response.
 */

// ─── Result interfaces ──────────────────────────────────────────────────────

export interface FillBlanksResult {
  score: number;
  correctCount: number;
  totalBlanks: number;
  breakdown: Array<{
    blank: number;
    studentAnswer: string;
    correctAnswer: string;
    correct: boolean;
  }>;
}

export type MCQResultState = 'correct_selected' | 'wrong_selected' | 'missed' | 'neutral';

export interface MCQMultipleResult {
  score: number;
  totalPoints: number;
  numberOfCorrect: number;
  optionResults: Array<{
    label: string;
    text: string;
    selected: boolean;
    isCorrect: boolean;
    result: MCQResultState;
  }>;
}

export interface ReorderResult {
  score: number;
  correctPairs: number;
  totalPairs: number;
  studentSequence: string[];
  correctSequence: string[];
}

export interface MCQSingleResult {
  score: number;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  correctAnswerText: string;
  optionResults: Array<{
    label: string;
    text: string;
    selected: boolean;
    isCorrect: boolean;
  }>;
}

export type ReadingBreakdown =
  | FillBlanksResult
  | MCQMultipleResult
  | ReorderResult
  | MCQSingleResult;

export interface ReadingScore {
  questionType: ReadingQuestionType;
  finalScore: number;
  displayScore: string;
  feedback: string;
  breakdown: ReadingBreakdown;
}

/** Minimal question shape the scorers need — keeps this module decoupled from Mongoose. */
export interface ReadingQuestionData {
  blanks: Array<{ position: number; correctAnswer: string; options: string[] }>;
  options: Array<{ label: string; text: string; isCorrect: boolean }>;
  paragraphs: Array<{ label: string; text: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const round1 = (n: number): number => Math.round(n * 10) / 10;
const displayFromScore = (score: number): string => `${Math.round(score * 0.9)} / 90`;
/** Canonical comparison form for answers/labels — trimmed, lowercased. */
const norm = (s: string): string => (s ?? '').toString().trim().toLowerCase();

// ─── Fill in the Blanks (rw_fill_blanks + reading_fill_blanks) ───────────────

export function scoreFillBlanks(
  studentAnswers: string[],
  correctAnswers: string[]
): FillBlanksResult {
  const totalBlanks = correctAnswers.length;

  const breakdown = correctAnswers.map((correctAnswer, i) => {
    const studentAnswer = studentAnswers[i] ?? '';
    const correct = norm(studentAnswer) === norm(correctAnswer) && norm(correctAnswer) !== '';
    return { blank: i + 1, studentAnswer, correctAnswer, correct };
  });

  const correctCount = breakdown.filter((b) => b.correct).length;
  const score = totalBlanks === 0 ? 0 : round1((correctCount / totalBlanks) * 100);

  return { score, correctCount, totalBlanks, breakdown };
}

// ─── MCQ Multiple Answers (negative marking) ─────────────────────────────────

export function scoreMCQMultiple(
  studentAnswers: string[],
  options: ReadingQuestionData['options']
): MCQMultipleResult {
  const selectedSet = new Set(studentAnswers.map(norm));
  const numberOfCorrect = options.filter((o) => o.isCorrect).length;

  let totalPoints = 0;
  const optionResults = options.map((opt) => {
    const selected = selectedSet.has(norm(opt.label));
    if (selected && opt.isCorrect) totalPoints += 1;
    else if (selected && !opt.isCorrect) totalPoints -= 1;

    let result: MCQResultState;
    if (selected && opt.isCorrect) result = 'correct_selected';
    else if (selected && !opt.isCorrect) result = 'wrong_selected';
    else if (!selected && opt.isCorrect) result = 'missed';
    else result = 'neutral';

    return { label: opt.label, text: opt.text, selected, isCorrect: opt.isCorrect, result };
  });

  // Score cannot go below 0 — negative marking is capped.
  const score =
    numberOfCorrect === 0 ? 0 : round1((Math.max(0, totalPoints) / numberOfCorrect) * 100);

  return { score, totalPoints, numberOfCorrect, optionResults };
}

// ─── Re-order Paragraphs (pair-based) ────────────────────────────────────────

export function scoreReorderParagraphs(
  studentSequence: string[],
  correctSequence: string[]
): ReorderResult {
  const n = correctSequence.length;
  const totalPairs = (n * (n - 1)) / 2;

  // Position of each label in the student's sequence (canonicalised).
  const studentPos = new Map<string, number>();
  studentSequence.forEach((label, i) => {
    const key = norm(label);
    if (!studentPos.has(key)) studentPos.set(key, i); // first occurrence wins
  });

  let correctPairs = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const leftPos = studentPos.get(norm(correctSequence[i]));
      const rightPos = studentPos.get(norm(correctSequence[j]));
      if (leftPos !== undefined && rightPos !== undefined && leftPos < rightPos) {
        correctPairs += 1;
      }
    }
  }

  const score = totalPairs === 0 ? 0 : round1((correctPairs / totalPairs) * 100);

  return { score, correctPairs, totalPairs, studentSequence, correctSequence };
}

// ─── MCQ Single Answer (binary) ──────────────────────────────────────────────

export function scoreMCQSingle(
  studentAnswer: string,
  options: ReadingQuestionData['options']
): MCQSingleResult {
  const correctOption = options.find((o) => o.isCorrect);
  const correctAnswer = correctOption?.label ?? '';
  const correctAnswerText = correctOption?.text ?? '';
  const isCorrect = correctAnswer !== '' && norm(studentAnswer) === norm(correctAnswer);

  const optionResults = options.map((opt) => ({
    label: opt.label,
    text: opt.text,
    selected: norm(opt.label) === norm(studentAnswer),
    isCorrect: opt.isCorrect,
  }));

  return {
    score: isCorrect ? 100 : 0,
    isCorrect,
    studentAnswer,
    correctAnswer,
    correctAnswerText,
    optionResults,
  };
}

// ─── Feedback ─────────────────────────────────────────────────────────────

export function generateReadingFeedback(score: number, _questionType: ReadingQuestionType): string {
  if (score >= 80) return 'Excellent! Strong reading comprehension.';
  if (score >= 60) return 'Good attempt. Review the incorrect answers carefully.';
  if (score >= 40) return 'Keep practising. Read the passage more carefully before answering.';
  return 'Needs improvement. Take time to read the full passage.';
}

// ─── Single entry point — routes to the correct scorer ───────────────────────

export function calculateReadingScore(
  questionType: ReadingQuestionType,
  studentAnswer: string | string[],
  question: ReadingQuestionData
): ReadingScore {
  const asArray = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
  const asString = Array.isArray(studentAnswer) ? (studentAnswer[0] ?? '') : studentAnswer;

  let breakdown: ReadingBreakdown;
  switch (questionType) {
    case 'rw_fill_blanks':
    case 'reading_fill_blanks':
      breakdown = scoreFillBlanks(asArray, question.blanks.map((b) => b.correctAnswer));
      break;
    case 'mcq_multiple':
      breakdown = scoreMCQMultiple(asArray, question.options);
      break;
    case 'reorder_paragraphs':
      breakdown = scoreReorderParagraphs(asArray, question.paragraphs.map((p) => p.label));
      break;
    case 'mcq_single':
      breakdown = scoreMCQSingle(asString, question.options);
      break;
    default: {
      // Exhaustiveness guard — unreachable for valid types.
      const _never: never = questionType;
      throw new Error(`Unsupported reading question type: ${_never as string}`);
    }
  }

  const finalScore = breakdown.score;
  return {
    questionType,
    finalScore,
    displayScore: displayFromScore(finalScore),
    feedback: generateReadingFeedback(finalScore, questionType),
    breakdown,
  };
}
