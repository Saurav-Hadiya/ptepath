import { distance } from 'fastest-levenshtein';
import { SpeakingQuestionType } from '../types';
import { TranscriptWord } from '../services/stt.adapter';

/**
 * Speaking module scoring — rule-based only. No AI, no paid services.
 *
 * Criteria, weights and formulas come from docs/md/speaking-module.md.
 * All sub-scores are percentages (0-100). The final score is a weighted
 * percentage; displayScore is rendered on the real PTE scale (out of 90):
 *   displayScore = Math.round(finalPercent × 0.90) + ' / 90'
 */

export interface SpeakingScore {
  contentScore: number | null;
  fluencyScore: number | null;
  pronunciationScore: number | null;
  engagementScore: number | null;
  finalScore: number;
  displayScore: string;
  wpm: number | null;
  feedback: string;
  correctAnswer?: string;
}

interface FluencyResult {
  score: number;
  wpm: number;
  pauseCount: number;
}

const EDIT_DISTANCE_THRESHOLD = 2;
const PAUSE_GAP_SECONDS = 2;

// ─── Text helpers ─────────────────────────────────────────────────────────

/** Lowercase, strip punctuation, collapse whitespace. */
function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toWords(text: string): string[] {
  const cleaned = cleanText(text);
  return cleaned.length === 0 ? [] : cleaned.split(' ');
}

/** True if any word in the transcript matches `target` within edit distance ≤ 2. */
function hasFuzzyMatch(target: string, transcriptWords: string[]): boolean {
  return transcriptWords.some((w) => distance(target, w) <= EDIT_DISTANCE_THRESHOLD);
}

/** Linear interpolation of `value` from an input range onto an output range. */
function lerp(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  const ratio = (value - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function displayFromPercent(finalPercent: number): string {
  return `${Math.round(finalPercent * 0.9)} / 90`;
}

// ─── Criterion scorers ────────────────────────────────────────────────────

/** Word-match percentage of expected words found in the transcript (fuzzy ≤ 2). */
export function calculateContentScore(transcript: string, expectedText: string): number {
  const expectedWords = toWords(expectedText);
  const transcriptWords = toWords(transcript);
  if (expectedWords.length === 0) return 0;

  let matchCount = 0;
  for (const word of expectedWords) {
    if (hasFuzzyMatch(word, transcriptWords)) matchCount += 1;
  }

  return Math.round((matchCount / expectedWords.length) * 100);
}

/** WPM-based fluency with long-pause penalty. */
export function calculateFluencyScore(words: TranscriptWord[], speakingTime: number): FluencyResult {
  if (words.length === 0) {
    return { score: 0, wpm: 0, pauseCount: 0 };
  }

  let totalDuration = words[words.length - 1].end - words[0].start;
  if (totalDuration <= 0) totalDuration = speakingTime;

  const wpm = totalDuration > 0 ? (words.length / totalDuration) * 60 : 0;

  let score: number;
  if (wpm < 60) {
    score = lerp(wpm, 0, 60, 20, 40);
  } else if (wpm < 100) {
    score = lerp(wpm, 60, 100, 40, 65);
  } else if (wpm < 140) {
    score = lerp(wpm, 100, 140, 65, 85);
  } else if (wpm <= 180) {
    score = lerp(wpm, 140, 180, 85, 100);
  } else {
    // Above 180 — penalise for rushing: 75 down to 60 over 180-240 wpm.
    score = clamp(lerp(wpm, 180, 240, 75, 60), 60, 75);
  }

  // Pause detection: gap between consecutive words > 2s → deduct 2 points each.
  let pauseCount = 0;
  for (let i = 0; i < words.length - 1; i += 1) {
    if (words[i + 1].start - words[i].end > PAUSE_GAP_SECONDS) pauseCount += 1;
  }
  score = Math.max(0, score - pauseCount * 2);

  return { score: Math.round(score), wpm: Math.round(wpm), pauseCount };
}

/** Pronunciation proxy: ratio of expected words recognised in the transcript. */
export function calculatePronunciationScore(transcript: string, expectedText: string): number {
  const expectedWords = toWords(expectedText);
  const transcriptWords = toWords(transcript);
  if (expectedWords.length === 0) return 0;

  let matched = 0;
  for (const word of expectedWords) {
    if (hasFuzzyMatch(word, transcriptWords)) matched += 1;
  }

  return Math.round((matched / expectedWords.length) * 100);
}

/** Engagement: words spoken vs expected for the recording duration, capped 100. */
export function calculateEngagementScore(transcript: string, recordingDuration: number): number {
  const actualWords = toWords(transcript).length;
  const expectedWords = recordingDuration * 2.2;
  if (expectedWords <= 0) return 0;

  const score = (actualWords / expectedWords) * 100;
  return Math.round(Math.min(score, 100));
}

// ─── Feedback ─────────────────────────────────────────────────────────────

const FEEDBACK = {
  content: {
    low: 'Many words were missed. Practise reading the passage clearly before recording begins.',
    mid: 'Some words were missed or unclear. Try to read every word in the passage.',
  },
  fluency: {
    low: 'Your pace was quite slow. Try to speak more continuously without long pauses.',
    mid: 'Your pace could be more natural. Aim for a steady rhythm without stopping.',
  },
  pronunciation: {
    low: 'Your speech was difficult to understand. Practise speaking each word clearly.',
    mid: 'Your pronunciation could be clearer. Focus on enunciating each word distinctly.',
  },
  engagement: {
    low: 'Try to speak throughout the full time given. There is no penalty for attempting.',
    mid: 'Try to speak throughout the full time given. There is no penalty for attempting.',
  },
} as const;

const EXCELLENT = 'Excellent attempt! Keep practising to maintain this level of performance.';

type Criterion = keyof typeof FEEDBACK;

/**
 * Returns one feedback message based on the lowest-scoring criterion.
 * If every scored criterion is above 80%, returns the excellent message.
 */
export function generateFeedback(
  scores: Pick<
    SpeakingScore,
    'contentScore' | 'fluencyScore' | 'pronunciationScore' | 'engagementScore'
  >,
  _questionType: SpeakingQuestionType
): string {
  const scored: Array<{ criterion: Criterion; value: number }> = [];
  if (scores.contentScore !== null) scored.push({ criterion: 'content', value: scores.contentScore });
  if (scores.fluencyScore !== null) scored.push({ criterion: 'fluency', value: scores.fluencyScore });
  if (scores.pronunciationScore !== null)
    scored.push({ criterion: 'pronunciation', value: scores.pronunciationScore });
  if (scores.engagementScore !== null)
    scored.push({ criterion: 'engagement', value: scores.engagementScore });

  if (scored.length === 0) return EXCELLENT;

  // Every scored criterion above 80% → excellent.
  if (scored.every((s) => s.value > 80)) return EXCELLENT;

  const lowest = scored.reduce((min, s) => (s.value < min.value ? s : min), scored[0]);
  return lowest.value < 50 ? FEEDBACK[lowest.criterion].low : FEEDBACK[lowest.criterion].mid;
}

// ─── Per-question-type scorers ──────────────────────────────────────────────

/** Read Aloud — content 40%, fluency 40%, pronunciation 20%. */
export function scoreReadAloud(
  transcript: string,
  words: TranscriptWord[],
  passage: string,
  speakingTime: number
): SpeakingScore {
  const contentScore = calculateContentScore(transcript, passage);
  const fluencyData = calculateFluencyScore(words, speakingTime);
  const pronunciationScore = calculatePronunciationScore(transcript, passage);

  const finalPercent =
    contentScore * 0.4 + fluencyData.score * 0.4 + pronunciationScore * 0.2;
  const finalScore = Math.round(finalPercent * 10) / 10;

  const feedback = generateFeedback(
    { contentScore, fluencyScore: fluencyData.score, pronunciationScore, engagementScore: null },
    'read_aloud'
  );

  return {
    contentScore,
    fluencyScore: fluencyData.score,
    pronunciationScore,
    engagementScore: null,
    finalScore,
    displayScore: displayFromPercent(finalPercent),
    wpm: fluencyData.wpm,
    feedback,
  };
}

/** Repeat Sentence — identical weights to Read Aloud. */
export function scoreRepeatSentence(
  transcript: string,
  words: TranscriptWord[],
  sentence: string,
  speakingTime: number
): SpeakingScore {
  const contentScore = calculateContentScore(transcript, sentence);
  const fluencyData = calculateFluencyScore(words, speakingTime);
  const pronunciationScore = calculatePronunciationScore(transcript, sentence);

  const finalPercent =
    contentScore * 0.4 + fluencyData.score * 0.4 + pronunciationScore * 0.2;
  const finalScore = Math.round(finalPercent * 10) / 10;

  const feedback = generateFeedback(
    { contentScore, fluencyScore: fluencyData.score, pronunciationScore, engagementScore: null },
    'repeat_sentence'
  );

  return {
    contentScore,
    fluencyScore: fluencyData.score,
    pronunciationScore,
    engagementScore: null,
    finalScore,
    displayScore: displayFromPercent(finalPercent),
    wpm: fluencyData.wpm,
    feedback,
  };
}

/** Describe Image — fluency 50%, pronunciation 20%, engagement 30% (no content). */
export function scoreDescribeImage(
  transcript: string,
  words: TranscriptWord[],
  recordingDuration: number
): SpeakingScore {
  const fluencyData = calculateFluencyScore(words, recordingDuration);
  const pronunciationScore = calculatePronunciationScore(transcript, transcript);
  const engagementScore = calculateEngagementScore(transcript, recordingDuration);

  const finalPercent =
    fluencyData.score * 0.5 + pronunciationScore * 0.2 + engagementScore * 0.3;
  const finalScore = Math.round(finalPercent * 10) / 10;

  const feedback = generateFeedback(
    { contentScore: null, fluencyScore: fluencyData.score, pronunciationScore, engagementScore },
    'describe_image'
  );

  return {
    contentScore: null,
    fluencyScore: fluencyData.score,
    pronunciationScore,
    engagementScore,
    finalScore,
    displayScore: displayFromPercent(finalPercent),
    wpm: fluencyData.wpm,
    feedback,
  };
}

/** Respond to Situation — identical to Describe Image. */
export function scoreRespondSituation(
  transcript: string,
  words: TranscriptWord[],
  recordingDuration: number
): SpeakingScore {
  const fluencyData = calculateFluencyScore(words, recordingDuration);
  const pronunciationScore = calculatePronunciationScore(transcript, transcript);
  const engagementScore = calculateEngagementScore(transcript, recordingDuration);

  const finalPercent =
    fluencyData.score * 0.5 + pronunciationScore * 0.2 + engagementScore * 0.3;
  const finalScore = Math.round(finalPercent * 10) / 10;

  const feedback = generateFeedback(
    { contentScore: null, fluencyScore: fluencyData.score, pronunciationScore, engagementScore },
    'respond_situation'
  );

  return {
    contentScore: null,
    fluencyScore: fluencyData.score,
    pronunciationScore,
    engagementScore,
    finalScore,
    displayScore: displayFromPercent(finalPercent),
    wpm: fluencyData.wpm,
    feedback,
  };
}

/** Answer Short Question — content 70% (binary correct/wrong), pronunciation 30%. */
export function scoreAnswerShort(transcript: string, acceptedAnswers: string[]): SpeakingScore {
  const cleanedTranscript = cleanText(transcript);

  let isCorrect = false;
  for (const answer of acceptedAnswers) {
    const cleanedAnswer = cleanText(answer);
    if (distance(cleanedAnswer, cleanedTranscript) <= EDIT_DISTANCE_THRESHOLD) {
      isCorrect = true;
      break;
    }
  }

  const contentScore = isCorrect ? 100 : 0;
  const pronunciationScore = calculatePronunciationScore(transcript, transcript);

  const finalPercent = contentScore * 0.7 + pronunciationScore * 0.3;
  const finalScore = Math.round(finalPercent * 10) / 10;

  const feedback = generateFeedback(
    { contentScore, fluencyScore: null, pronunciationScore, engagementScore: null },
    'answer_short'
  );

  const primaryCorrectAnswer = acceptedAnswers[0] ?? '';

  return {
    contentScore,
    fluencyScore: null,
    pronunciationScore,
    engagementScore: null,
    finalScore,
    displayScore: displayFromPercent(finalPercent),
    wpm: null,
    feedback,
    correctAnswer: primaryCorrectAnswer,
  };
}
