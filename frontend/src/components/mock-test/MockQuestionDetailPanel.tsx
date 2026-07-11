'use client';

import ScoreBreakdownCard from '@/components/shared/ScoreBreakdownCard';
import { deriveScoreBars } from '@/lib/score-bars';
import type { MockTestQuestionResult } from '@/types';

interface Props {
  question: MockTestQuestionResult;
}

function feedbackForScore(score: number): string {
  if (score >= 80) return 'Excellent work on this question.';
  if (score >= 50) return 'Good effort. Review this question type to improve.';
  return 'Keep practising this question type.';
}

/** Inline (non-modal) per-question score detail — expands directly under its row. */
export default function MockQuestionDetailPanel({ question }: Props) {
  const bars = deriveScoreBars(question.breakdown, question.score);

  return (
    <ScoreBreakdownCard
      title="Score Breakdown"
      displayScore={question.displayScore}
      finalScore={question.score}
      bars={bars}
      feedback={feedbackForScore(question.score)}
    />
  );
}
