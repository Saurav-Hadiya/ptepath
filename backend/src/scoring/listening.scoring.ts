import { distance } from 'fastest-levenshtein';
import { ListeningQuestionType } from '../types';
import { countWords, checkSpelling, SpellingResult } from './writing.scoring';
import {
  scoreMCQMultiple,
  scoreMCQSingle,
  MCQMultipleResult,
  MCQSingleResult,
} from './reading.scoring';

/**
 * Listening module scoring — rule-based only. No AI, no paid services.
 *
 * 5 of 8 types reuse existing scorers from the writing/reading modules; only
 * three functions are new here:
 *   - scoreSummariseSpoken     (word count + spelling, listening word bands)
 *   - scoreFillBlanksListening (fuzzy per-blank — students type under audio pressure)
 *   - scoreHighlightIncorrect  (per-word +1/-1 negative marking)
 *   - scoreWriteDictation      (fuzzy word match + spelling, two-part score)
 *
 * All sub-scores are percentages (0-100). displayScore is rendered on the real
 * PTE scale (out of 90): displayScore = Math.round(score × 0.90) + ' / 90'.
 *
 * Correct answers live in the DB and are revealed only in the score response
 * returned from here — never in the question-fetch response.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

const round1 = (n: number): number => Math.round(n * 10) / 10;
const displayFromScore = (score: number): string => `${Math.round(score * 0.9)} / 90`;
/** Canonical comparison form — trimmed, lowercased. */
const norm = (s: string): string => (s ?? '').toString().trim().toLowerCase();

// ─── Result interfaces ──────────────────────────────────────────────────────

export interface SummariseSpokenResult {
  score: number;
  wordCount: number;
  wordCountScore: number;
  spellingScore: number;
  spellingResult: SpellingResult;
  misspelledWords: string[];
}

export type FillBlankState = 'exact' | 'close' | 'wrong';

export interface FillBlanksListeningResult {
  score: number;
  totalPoints: number;
  totalBlanks: number;
  breakdown: Array<{
    blank: number;
    studentAnswer: string;
    correctAnswer: string;
    distance: number;
    points: number;
    result: FillBlankState;
  }>;
}

export type HighlightWordState = 'correct_click' | 'wrong_click' | 'missed' | 'neutral';

export interface HighlightIncorrectResult {
  score: number;
  totalPoints: number;
  totalIncorrect: number;
  wordResults: Array<{
    index: number;
    clicked: boolean;
    isIncorrect: boolean;
    result: HighlightWordState;
  }>;
}

export type DictationState = 'exact' | 'close' | 'missed';

export interface WriteDictationResult {
  score: number;
  wordMatchScore: number;
  spellingScore: number;
  matchedWords: number;
  exactMatches: number;
  totalWords: number;
  correctSentence: string;
  breakdown: Array<{
    correctWord: string;
    studentWord: string | null;
    distance: number;
    result: DictationState;
  }>;
}

export type ListeningBreakdown =
  | SummariseSpokenResult
  | MCQMultipleResult
  | MCQSingleResult
  | FillBlanksListeningResult
  | HighlightIncorrectResult
  | WriteDictationResult;

export interface ListeningScore {
  questionType: ListeningQuestionType;
  finalScore: number;
  displayScore: string;
  feedback: string;
  breakdown: ListeningBreakdown;
}

/** Minimal question shape the scorers need — keeps this module decoupled from Mongoose. */
export interface ListeningQuestionData {
  options: Array<{ label: string; text: string; isCorrect: boolean }>;
  blanks: Array<{ position: number; correctWord: string }>;
  incorrectWordIndices: number[];
  correctSentence: string | null;
}

// ─── Type 1 — Summarise Spoken Text (word count 50% + spelling 50%) ───────────

/**
 * Word-count compliance bands specific to Summarise Spoken Text:
 *   0-29 → 0, 30-49 → 60, 50-70 → 100, 71-85 → 50, 86+ → 0.
 */
function summariseWordCountScore(wordCount: number): number {
  if (wordCount <= 29) return 0;
  if (wordCount <= 49) return 60;
  if (wordCount <= 70) return 100;
  if (wordCount <= 85) return 50;
  return 0;
}

export function scoreSummariseSpoken(responseText: string): SummariseSpokenResult {
  const wordCount = countWords(responseText);
  const wordCountScore = summariseWordCountScore(wordCount);
  const spellingResult = checkSpelling(responseText);
  const spellingScore = spellingResult.score;

  const score = round1(wordCountScore * 0.5 + spellingScore * 0.5);

  return {
    score,
    wordCount,
    wordCountScore,
    spellingScore,
    spellingResult,
    misspelledWords: spellingResult.misspelled,
  };
}

// ─── Type 3 — Fill in the Blanks (fuzzy per-blank partial credit) ─────────────

/** Edit distance → points: 0 → 1.0, 1 → 0.7, 2 → 0.4, >2 → 0.0. */
function fuzzyPoints(d: number): number {
  if (d === 0) return 1.0;
  if (d === 1) return 0.7;
  if (d === 2) return 0.4;
  return 0.0;
}

export function scoreFillBlanksListening(
  studentAnswers: string[],
  blanks: ListeningQuestionData['blanks']
): FillBlanksListeningResult {
  const totalBlanks = blanks.length;

  const breakdown = blanks.map((blank, i) => {
    const studentAnswerRaw = studentAnswers[i] ?? '';
    const studentWord = norm(studentAnswerRaw);
    const correctWord = norm(blank.correctWord);
    const d = distance(studentWord, correctWord);
    const points = fuzzyPoints(d);

    let result: FillBlankState;
    if (d === 0) result = 'exact';
    else if (d <= 2) result = 'close';
    else result = 'wrong';

    return {
      blank: i + 1,
      studentAnswer: studentAnswerRaw,
      correctAnswer: blank.correctWord,
      distance: d,
      points,
      result,
    };
  });

  const totalPoints = round1(breakdown.reduce((sum, b) => sum + b.points, 0));
  const score = totalBlanks === 0 ? 0 : round1((totalPoints / totalBlanks) * 100);

  return { score, totalPoints, totalBlanks, breakdown };
}

// ─── Type 7 — Highlight Incorrect Words (per-word negative marking) ───────────

export function scoreHighlightIncorrect(
  clickedIndices: number[],
  incorrectWordIndices: number[]
): HighlightIncorrectResult {
  const clickedSet = new Set(clickedIndices);
  const incorrectSet = new Set(incorrectWordIndices);
  const totalIncorrect = incorrectSet.size;

  let totalPoints = 0;
  for (const index of clickedSet) {
    totalPoints += incorrectSet.has(index) ? 1 : -1;
  }

  // Report every index the student interacted with OR that was actually wrong.
  const allIndices = Array.from(new Set([...clickedSet, ...incorrectSet])).sort((a, b) => a - b);
  const wordResults = allIndices.map((index) => {
    const clicked = clickedSet.has(index);
    const isIncorrect = incorrectSet.has(index);

    let result: HighlightWordState;
    if (clicked && isIncorrect) result = 'correct_click';
    else if (clicked && !isIncorrect) result = 'wrong_click';
    else if (!clicked && isIncorrect) result = 'missed';
    else result = 'neutral';

    return { index, clicked, isIncorrect, result };
  });

  // Score cannot go below 0 — negative marking is capped.
  const score =
    totalIncorrect === 0 ? 0 : round1((Math.max(0, totalPoints) / totalIncorrect) * 100);

  return { score, totalPoints, totalIncorrect, wordResults };
}

// ─── Type 8 — Write from Dictation (fuzzy word match 70% + spelling 30%) ───────

function splitWords(text: string): string[] {
  const trimmed = (text ?? '').toString().trim().toLowerCase();
  if (trimmed.length === 0) return [];
  return trimmed.split(/\s+/).filter((w) => w.length > 0);
}

export function scoreWriteDictation(
  studentText: string,
  correctSentence: string
): WriteDictationResult {
  const correctWords = splitWords(correctSentence);
  const studentWords = splitWords(studentText);
  const totalWords = correctWords.length;

  // Greedy match: each student word can satisfy at most one correct word, so a
  // single typed word never inflates the score across multiple expected words.
  const used = new Array<boolean>(studentWords.length).fill(false);
  let matchedWords = 0;
  let exactMatches = 0;

  const breakdown = correctWords.map((correctWord) => {
    let bestIdx = -1;
    let bestDistance = Infinity;

    for (let i = 0; i < studentWords.length; i += 1) {
      if (used[i]) continue;
      const d = distance(correctWord, studentWords[i]);
      if (d < bestDistance) {
        bestDistance = d;
        bestIdx = i;
      }
    }

    // A match counts only within edit distance ≤ 2.
    if (bestIdx !== -1 && bestDistance <= 2) {
      used[bestIdx] = true;
      matchedWords += 1;
      if (bestDistance === 0) exactMatches += 1;

      return {
        correctWord,
        studentWord: studentWords[bestIdx],
        distance: bestDistance,
        result: (bestDistance === 0 ? 'exact' : 'close') as DictationState,
      };
    }

    return { correctWord, studentWord: null, distance: -1, result: 'missed' as DictationState };
  });

  const wordMatchScore = totalWords === 0 ? 0 : round1((matchedWords / totalWords) * 100);
  const spellingScore = totalWords === 0 ? 0 : round1((exactMatches / totalWords) * 100);
  const score = round1(wordMatchScore * 0.7 + spellingScore * 0.3);

  return {
    score,
    wordMatchScore,
    spellingScore,
    matchedWords,
    exactMatches,
    totalWords,
    correctSentence,
    breakdown,
  };
}

// ─── Feedback ─────────────────────────────────────────────────────────────

export function generateListeningFeedback(
  score: number,
  _questionType: ListeningQuestionType
): string {
  if (score >= 80) return 'Excellent listening accuracy!';
  if (score >= 60) return 'Good attempt. Listen carefully to each word.';
  if (score >= 40) return 'Keep practising. Focus on key words while listening.';
  return 'Needs improvement. Try to listen for the main ideas first.';
}

// ─── Single entry point — routes to the correct scorer ───────────────────────

export function calculateListeningScore(
  questionType: ListeningQuestionType,
  studentAnswer: string | Array<string | number>,
  question: ListeningQuestionData
): ListeningScore {
  const asStringArray = (Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer]).map((v) =>
    String(v)
  );
  const asString = Array.isArray(studentAnswer)
    ? String(studentAnswer[0] ?? '')
    : String(studentAnswer ?? '');
  const asNumberArray = (Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer])
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));

  let breakdown: ListeningBreakdown;
  switch (questionType) {
    case 'summarise_spoken':
      breakdown = scoreSummariseSpoken(asString);
      break;
    case 'mcq_multiple':
      breakdown = scoreMCQMultiple(asStringArray, question.options);
      break;
    case 'fill_blanks':
      breakdown = scoreFillBlanksListening(asStringArray, question.blanks);
      break;
    case 'highlight_summary':
    case 'mcq_single':
    case 'select_missing':
      breakdown = scoreMCQSingle(asString, question.options);
      break;
    case 'highlight_incorrect':
      breakdown = scoreHighlightIncorrect(asNumberArray, question.incorrectWordIndices);
      break;
    case 'write_dictation':
      breakdown = scoreWriteDictation(asString, question.correctSentence ?? '');
      break;
    default: {
      // Exhaustiveness guard — unreachable for valid types.
      const _never: never = questionType;
      throw new Error(`Unsupported listening question type: ${_never as string}`);
    }
  }

  const finalScore = breakdown.score;
  return {
    questionType,
    finalScore,
    displayScore: displayFromScore(finalScore),
    feedback: generateListeningFeedback(finalScore, questionType),
    breakdown,
  };
}
