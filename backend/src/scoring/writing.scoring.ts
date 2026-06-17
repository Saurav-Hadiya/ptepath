import { ScoreResult } from '../types';

// nspell dictionary loaded once at module level — implemented in writing module step
export function scoreWriting(response: string, referenceText: string): ScoreResult {
  return { score: 0, maxScore: 90, displayScore: '0 / 90' };
}
