export interface ScoreBar {
  label: string;
  score: number;
}

/**
 * Derives sub-score bars from a scoring breakdown by inspecting the actual
 * fields present, not by matching a hand-maintained list of question-type
 * names. If the backend adds a new type that reuses an existing scorer under
 * the hood, this keeps working with zero changes here.
 *
 * Shared by every attempt page (Reading, Listening) and the mock test result
 * detail modal, all of which reuse the same underlying scoring functions.
 */
export function deriveScoreBars(breakdown: unknown, finalScore: number): ScoreBar[] {
  const b = (breakdown ?? {}) as Record<string, unknown>;
  const num = (key: string): number | null => (typeof b[key] === 'number' ? (b[key] as number) : null);

  // Summarise Spoken / Summarise Written Text — word count + spelling scorer.
  const wordCountScore = num('wordCountScore');
  const spellingScore = num('spellingScore');
  if (wordCountScore !== null && spellingScore !== null) {
    return [
      { label: 'Word Count', score: wordCountScore },
      { label: 'Spelling', score: spellingScore },
    ];
  }

  // Write from Dictation — word match + spelling scorer.
  const wordMatchScore = num('wordMatchScore');
  if (wordMatchScore !== null && spellingScore !== null) {
    return [
      { label: 'Word Match', score: wordMatchScore },
      { label: 'Spelling', score: spellingScore },
    ];
  }

  // Reorder Paragraphs — pair-based scorer.
  if (num('correctPairs') !== null && num('totalPairs') !== null) {
    return [{ label: 'Order Accuracy', score: finalScore }];
  }

  // Binary single-answer shapes: MCQ Single / Highlight Summary / Select
  // Missing Word (scoreMCQSingle's `isCorrect`/`correctAnswerText`), or a
  // pre-scored Speaking answer (mock test's `{ preScored }` shape) — neither
  // has a meaningful sub-score to show, just the overall result.
  if (typeof b.isCorrect === 'boolean' || typeof b.correctAnswerText === 'string' || typeof b.preScored === 'boolean') {
    return [];
  }

  // Everything else (MCQ Multiple, Fill Blanks, Highlight Incorrect, etc.) —
  // a single number with no separately-named sub-scores.
  return [{ label: 'Accuracy', score: finalScore }];
}
