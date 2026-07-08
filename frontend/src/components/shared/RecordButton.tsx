'use client';

import { Mic, Square, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

type RecordButtonState = 'idle' | 'preparing' | 'recording' | 'processing';

interface RecordButtonProps {
  state: RecordButtonState;
  onStart?: () => void;
  onStop?: () => void;
  /** Shown only in the 'preparing' state — lets a ready student skip the remaining wait time. */
  onSkip?: () => void;
  countdown?: number;
}

const STATE_LABELS: Record<RecordButtonState, string> = {
  idle: 'Click to record',
  preparing: 'Prepare to speak',
  recording: 'Recording...',
  processing: 'Analysing your response...',
};

export default function RecordButton({ state, onStart, onStop, onSkip, countdown }: RecordButtonProps) {
  const handleClick = () => {
    if (state === 'idle') onStart?.();
    if (state === 'recording') onStop?.();
  };

  return (
    <div className="flex flex-col items-center gap-3.5 rounded-card border border-border-default bg-bg-page p-6">
      <span className="text-center text-body-sm text-text-secondary">{STATE_LABELS[state]}</span>

      {state === 'preparing' && (
        <span className="font-display text-score-xl text-brand-primary">{countdown}</span>
      )}

      {state === 'recording' && typeof countdown === 'number' && (
        <span className="font-display text-score-lg text-feedback-error" aria-live="polite">
          {countdown}
        </span>
      )}

      {state === 'processing' && <LoadingSpinner size="lg" />}

      {(state === 'idle' || state === 'recording') && (
        <Button
          type="button"
          onClick={handleClick}
          aria-label={state === 'recording' ? 'Stop recording and submit' : 'Start recording'}
          className={`flex size-17 items-center justify-center rounded-full p-0 text-primary-foreground shadow-button transition-all ${
            state === 'recording' ? 'animate-pulse bg-feedback-error hover:bg-feedback-error/90' : 'bg-action-default hover:bg-action-hover'
          }`}
        >
          {state === 'recording' ? (
            <Square className="size-6" fill="currentColor" />
          ) : (
            <Mic className="size-6" />
          )}
        </Button>
      )}

      {state === 'preparing' && (
        <Button
          type="button"
          disabled
          className="flex size-17 items-center justify-center rounded-full bg-action-default p-0 text-primary-foreground opacity-50 shadow-button"
        >
          <Mic className="size-6" />
        </Button>
      )}

      {state === 'recording' && (
        <div className="flex h-8 items-end gap-0.75">
          {['h-full', 'h-[60%]', 'h-full', 'h-[70%]', 'h-[45%]'].map((heightClass, index) => (
            <span
              key={index}
              className={`w-0.75 animate-pulse rounded-sm bg-action-hover ${heightClass}`}
            />
          ))}
        </div>
      )}

      {state === 'recording' && onStop && (
        <Button
          type="button"
          variant="outline"
          onClick={onStop}
          className="gap-1.5 border-action-default text-action-default hover:bg-action-subtle"
        >
          <Square className="size-3.5" fill="currentColor" />
          Submit Now
        </Button>
      )}

      {state === 'preparing' && onSkip && (
        <Button
          type="button"
          variant="outline"
          onClick={onSkip}
          className="gap-1.5 border-action-default text-action-default hover:bg-action-subtle"
        >
          <SkipForward className="size-3.5" />
          I&apos;m Ready — Start Now
        </Button>
      )}
    </div>
  );
}
