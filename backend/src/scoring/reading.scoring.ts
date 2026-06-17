import { ScoreResult } from '../types';

// Implemented in reading module step
export function scoreReading(selected: string[], correct: string[]): ScoreResult {
  return { score: 0, maxScore: 90, displayScore: '0 / 90' };
}
