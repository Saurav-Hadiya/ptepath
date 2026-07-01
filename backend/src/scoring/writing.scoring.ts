import fs from 'fs';
import path from 'path';
import nspell from 'nspell';
import { WritingQuestionType } from '../types';

/**
 * Writing module scoring — rule-based only. No AI, no paid services.
 *
 * Two criteria, both weighted 50/50 for both question types:
 *   - Word count compliance  (plain JS)
 *   - Spelling accuracy       (nspell + dictionary-en)
 *
 * All sub-scores are percentages (0-100). displayScore is rendered on the real
 * PTE scale (out of 90): displayScore = Math.round(finalPercent × 0.90) + ' / 90'.
 *
 * Per docs/md/writing-module.md: the student's responseText is never persisted —
 * it is used only to compute the score returned from here.
 */

// ─── nspell — initialised ONCE at module load, reused for every request ───────

/**
 * dictionary-en@4 is an ESM-only package that reads its data files with a
 * top-level await, so it cannot be require()'d from this CommonJS build. We
 * resolve the package directory and read the Hunspell affix/dictionary files
 * directly — synchronous, dependency-free, and done a single time at startup.
 */
function createSpellChecker(): ReturnType<typeof nspell> {
  const dictionaryDir = path.dirname(require.resolve('dictionary-en'));
  const aff = fs.readFileSync(path.join(dictionaryDir, 'index.aff'));
  const dic = fs.readFileSync(path.join(dictionaryDir, 'index.dic'));
  return nspell(aff, dic);
}

const spellChecker = createSpellChecker();

// ─── Constants ────────────────────────────────────────────────────────────

/** Word-count → score tables, keyed by question type. Evaluated top-down. */
const WORD_COUNT_BANDS: Record<
  WritingQuestionType,
  Array<{ max: number; score: number }>
> = {
  // SWT: 0-4 → 0, 5-75 → 100, 76-90 → 50, 91+ → 0
  summarise_written_text: [
    { max: 4, score: 0 },
    { max: 75, score: 100 },
    { max: 90, score: 50 },
    { max: Infinity, score: 0 },
  ],
  // WE: 0-99 → 0, 100-149 → 25, 150-199 → 60, 200-300 → 100, 301-320 → 50, 321+ → 0
  write_essay: [
    { max: 99, score: 0 },
    { max: 149, score: 25 },
    { max: 199, score: 60 },
    { max: 300, score: 100 },
    { max: 320, score: 50 },
    { max: Infinity, score: 0 },
  ],
};

/** Valid word ranges per type — used for length-based feedback. */
const WORD_RANGES: Record<WritingQuestionType, { min: number; max: number }> = {
  summarise_written_text: { min: 5, max: 75 },
  write_essay: { min: 200, max: 300 },
};

/**
 * Tokens nspell flags as misspelled but which should not be penalised:
 * common abbreviations and contraction fragments. Lowercased.
 */
const ALLOWED_WORDS = new Set([
  'etc',
  'eg',
  'ie',
  'vs',
  'mr',
  'mrs',
  'ms',
  'dr',
  'st',
  'am',
  'pm',
  'ok',
  'usa',
  'uk',
  'tv',
  'pte',
  // "I"-contractions: stored capitalised in the dictionary, so the lowercased
  // forms nspell receives here are wrongly flagged.
  "i'm",
  "i've",
  "i'll",
  "i'd",
]);

// ─── Interfaces ──────────────────────────────────────────────────────────

export interface SpellingResult {
  total: number;
  correct: number;
  incorrect: number;
  /** All unique misspelled words (in order of first appearance). */
  misspelled: string[];
  /** (correct / total) × 100, rounded to 1 decimal. */
  score: number;
}

export interface WritingScore {
  wordCount: number;
  wordCountScore: number;
  spellingScore: number;
  spellingResult: SpellingResult;
  finalScore: number;
  displayScore: string;
  feedback: string;
  misspelledWords: string[];
}

// ─── Word counting ──────────────────────────────────────────────────────

/** Count whitespace-delimited words. Returns 0 for empty/whitespace-only text. */
export function countWords(text: string): number {
  if (typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).filter((w) => w.length > 0).length;
}

// ─── Spell checking (shared utility — also used by the listening module) ────

// All punctuation EXCEPT the apostrophe — apostrophes are kept so contractions
// (don't, it's, we're) validate against the dictionary, then trimmed off the
// edges of each token to drop possessives (students' → students).
const PUNCTUATION = /[.,!?;:"`()[\]{}<>/\\|@#$%^&*_~=+“”–—]/g;
const SMART_APOSTROPHE = /[‘’´]/g;
const EDGE_APOSTROPHES = /^'+|'+$/g;

/** A token that should not be spell-checked (number, single char, abbreviation). */
function isIgnorable(word: string): boolean {
  if (word.length < 2) return true; // single chars incl. "a", "i"
  if (/^\d+$/.test(word)) return true; // pure numbers, e.g. "2024"
  if (ALLOWED_WORDS.has(word)) return true;
  return false;
}

/**
 * Spelling accuracy for a response. Lowercases, strips punctuation, then runs
 * nspell on each word. Numbers, single characters and common abbreviations are
 * treated as correct (nspell over-flags them). Contractions are preserved.
 */
export function checkSpelling(text: string): SpellingResult {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { total: 0, correct: 0, incorrect: 0, misspelled: [], score: 0 };
  }

  const words = text
    .toLowerCase()
    .replace(SMART_APOSTROPHE, "'")
    .replace(PUNCTUATION, ' ')
    .split(/\s+/)
    .map((w) => w.replace(EDGE_APOSTROPHES, ''))
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    return { total: 0, correct: 0, incorrect: 0, misspelled: [], score: 0 };
  }

  let correct = 0;
  const misspelledSeen = new Set<string>();
  const misspelled: string[] = [];

  for (const word of words) {
    if (isIgnorable(word) || spellChecker.correct(word)) {
      correct += 1;
      continue;
    }
    // Misspelled — record once per unique word.
    if (!misspelledSeen.has(word)) {
      misspelledSeen.add(word);
      misspelled.push(word);
    }
  }

  const total = words.length;
  const incorrect = total - correct;
  const score = Math.round((correct / total) * 1000) / 10; // 1 decimal place

  return {
    total,
    correct,
    incorrect,
    // Return every unique misspelled word so the student sees all of them.
    misspelled,
    score,
  };
}

// ─── Word count scoring ─────────────────────────────────────────────────

/** Map a word count to a 0-100 compliance score for the given question type. */
export function calculateWordCountScore(
  wordCount: number,
  type: WritingQuestionType
): number {
  const bands = WORD_COUNT_BANDS[type];
  for (const band of bands) {
    if (wordCount <= band.max) return band.score;
  }
  return 0;
}

// ─── Feedback ─────────────────────────────────────────────────────────────

const FEEDBACK = {
  tooShort: 'Your response is too short. Please write at least the minimum required words.',
  tooLong: 'Your response exceeds the word limit. Please shorten it.',
  spellingLow: 'Several spelling errors were found. Review your spelling carefully.',
  spellingMid: 'Some spelling errors detected. Proofread before submitting.',
  goodLengthSpelling: 'Good word count but spelling needs attention.',
  wellDone: 'Well done! Your response length and spelling are both strong.',
} as const;

/**
 * Returns a single feedback message. Length problems are reported first (based
 * on the actual word count against the valid range), then spelling.
 */
export function generateWritingFeedback(
  wordCountScore: number,
  spellingScore: number,
  wordCount: number,
  type: WritingQuestionType
): string {
  const { min, max } = WORD_RANGES[type];

  if (wordCount < min) return FEEDBACK.tooShort;
  if (wordCount > max) return FEEDBACK.tooLong;

  // Word count is within the valid range here (wordCountScore is 100).
  if (spellingScore < 60) return FEEDBACK.spellingLow;
  if (spellingScore <= 80) return FEEDBACK.spellingMid;
  if (spellingScore > 85) return FEEDBACK.wellDone;
  return FEEDBACK.goodLengthSpelling; // spelling 80–85: good length, minor errors
}

// ─── Main entry point ──────────────────────────────────────────────────────

/** Single entry point for all writing scoring. */
export function scoreWriting(responseText: string, type: WritingQuestionType): WritingScore {
  const wordCount = countWords(responseText);
  const wordCountScore = calculateWordCountScore(wordCount, type);
  const spellingResult = checkSpelling(responseText);
  const spellingScore = spellingResult.score;

  const finalPercent = wordCountScore * 0.5 + spellingScore * 0.5;
  const finalScore = Math.round(finalPercent * 10) / 10;
  const displayScore = `${Math.round(finalPercent * 0.9)} / 90`;

  const feedback = generateWritingFeedback(wordCountScore, spellingScore, wordCount, type);

  return {
    wordCount,
    wordCountScore,
    spellingScore,
    spellingResult,
    finalScore,
    displayScore,
    feedback,
    misspelledWords: spellingResult.misspelled,
  };
}
