import { ScoreResult } from '../types';

// Implemented in listening module step
export function scoreListening(selected: string[], correct: string[]): ScoreResult {
  return { score: 0, maxScore: 90, displayScore: '0 / 90' };
}
