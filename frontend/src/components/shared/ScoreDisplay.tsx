'use client';

interface ScoreDisplayProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SCORE_SIZE: Record<NonNullable<ScoreDisplayProps['size']>, string> = {
  sm: 'text-score-md',
  md: 'text-score-lg',
  lg: 'text-score-xl',
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-feedback-success';
  if (score >= 50) return 'text-feedback-warning';
  return 'text-feedback-error';
}

export default function ScoreDisplay({ score, label, size = 'md' }: ScoreDisplayProps) {
  return (
    <div className="flex flex-col items-start">
      {label && <span className="mb-1 text-label-md text-text-secondary">{label}</span>}
      <div className="flex items-baseline gap-1.5">
        <span className={`font-display ${SCORE_SIZE[size]} ${getScoreColor(score)}`}>{score}</span>
        <span className="text-label-md text-text-muted">/ 90</span>
      </div>
    </div>
  );
}
