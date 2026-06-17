import { ScoreResult } from '../types';

// Implemented in speaking module step
export function scoreSpeaking(transcript: string, referenceText: string): ScoreResult {
  return { score: 0, maxScore: 90, displayScore: '0 / 90' };
}
