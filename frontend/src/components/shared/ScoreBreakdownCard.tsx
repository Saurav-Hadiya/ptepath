'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ScoreDisplay from '@/components/shared/ScoreDisplay';

interface ScoreBar {
  label: string;
  score: number;
}

interface ScoreBreakdownCardProps {
  title: string;
  displayScore: string;
  finalScore: number;
  bars: ScoreBar[];
  feedback: string;
  onNext?: () => void;
  nextLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

function getBarColor(score: number) {
  if (score >= 80) return 'bg-feedback-success';
  if (score >= 50) return 'bg-feedback-warning';
  return 'bg-feedback-error';
}

function getBarTextColor(score: number) {
  if (score >= 80) return 'text-feedback-success';
  if (score >= 50) return 'text-feedback-warning';
  return 'text-feedback-error';
}

export default function ScoreBreakdownCard({
  title,
  displayScore,
  finalScore,
  bars,
  feedback,
  onNext,
  nextLabel = 'Try Another Question',
  onRetry,
  retryLabel = 'Retry',
}: ScoreBreakdownCardProps) {
  const [scoreValue] = displayScore.split('/').map((part) => part.trim());

  return (
    <div className="w-full min-w-0 rounded-card border border-border-default bg-bg-card p-4 shadow-card sm:p-5">
      <div className="mb-4 font-display text-label-lg text-brand-primary">{title}</div>

      {/* Score hero — centered, never squeezed against the bars */}
      <div className="mb-5 flex justify-center rounded-input bg-bg-page py-5">
        <ScoreDisplay score={Number(scoreValue)} size="lg" />
      </div>

      {/* Criterion bars — label sits above its bar, so nothing ever competes
          for horizontal space and long labels can never clip or overlap. */}
      <div className="mb-5 space-y-4">
        {bars.map((bar) => (
          <div key={bar.label} className="min-w-0">
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-label-sm">
              <span className="min-w-0 truncate text-text-secondary">{bar.label}</span>
              <span className={`shrink-0 font-semibold ${getBarTextColor(bar.score)}`}>
                {bar.score}%
              </span>
            </div>
            <ProgressPrimitive.Root value={bar.score} className="block w-full">
              <ProgressPrimitive.Track className="relative h-1.5 w-full overflow-hidden rounded-full bg-border-default">
                <ProgressPrimitive.Indicator className={`h-full rounded-full ${getBarColor(bar.score)}`} />
              </ProgressPrimitive.Track>
            </ProgressPrimitive.Root>
          </div>
        ))}
      </div>

      <div className="mb-5 rounded-input border border-action-default/20 bg-action-subtle p-3 text-body-sm text-brand-primary">
        <strong className="mb-0.5 block">Feedback</strong>
        {feedback}
      </div>

      {(onRetry || onNext) && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              onClick={onRetry}
              className="w-full min-w-0 gap-1.5 border-brand-primary text-brand-primary hover:bg-action-subtle"
            >
              <RotateCcw className="size-4 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">Retry</span>
                <span className="hidden sm:inline">{retryLabel}</span>
              </span>
            </Button>
          )}
          {onNext && (
            <Button
              type="button"
              onClick={onNext}
              className="w-full min-w-0 gap-1.5 bg-brand-primary text-primary-foreground hover:bg-brand-primary/90"
            >
              <span className="truncate">
                <span className="sm:hidden">Next</span>
                <span className="hidden sm:inline">{nextLabel}</span>
              </span>
              <ArrowRight className="size-4 shrink-0" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
