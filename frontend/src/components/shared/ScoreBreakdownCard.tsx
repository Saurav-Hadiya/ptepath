'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { ArrowRight } from 'lucide-react';
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
}: ScoreBreakdownCardProps) {
  const [scoreValue] = displayScore.split('/').map((part) => part.trim());

  return (
    <div className="rounded-card border border-border-default bg-bg-card p-5 shadow-card">
      <div className="mb-4 font-display text-label-lg text-brand-primary">{title}</div>

      <div className="mb-4 flex items-center gap-4 rounded-input bg-bg-page p-4">
        <ScoreDisplay score={Number(scoreValue)} size="md" />
        <div className="flex flex-1 flex-col gap-2">
          {bars.map((bar) => (
            <div key={bar.label} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-label-sm text-text-secondary">{bar.label}</span>
              <ProgressPrimitive.Root value={bar.score} className="flex-1">
                <ProgressPrimitive.Track className="relative h-[5px] overflow-hidden rounded-full bg-border-default">
                  <ProgressPrimitive.Indicator
                    className={`h-full rounded-full ${getBarColor(bar.score)}`}
                  />
                </ProgressPrimitive.Track>
              </ProgressPrimitive.Root>
              <span className={`w-8 text-right text-label-sm font-semibold ${getBarTextColor(bar.score)}`}>
                {bar.score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-input border border-action-default/20 bg-action-subtle p-3 text-body-sm text-brand-primary">
        <strong className="mb-0.5 block">Feedback</strong>
        {feedback}
      </div>

      {onNext && (
        <Button
          type="button"
          onClick={onNext}
          className="w-full gap-1.5 bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {nextLabel}
          <ArrowRight className="size-4" />
        </Button>
      )}
    </div>
  );
}
