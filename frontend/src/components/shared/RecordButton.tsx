'use client';

import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

type RecordButtonState = 'idle' | 'preparing' | 'recording' | 'processing';

interface RecordButtonProps {
  state: RecordButtonState;
  onStart?: () => void;
  onStop?: () => void;
  countdown?: number;
}

const STATE_LABELS: Record<RecordButtonState, string> = {
  idle: 'Click to record',
  preparing: 'Prepare to speak',
  recording: 'Recording...',
  processing: 'Analysing your response...',
};

export default function RecordButton({ state, onStart, onStop, countdown }: RecordButtonProps) {
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

      {state === 'processing' && <LoadingSpinner size="lg" />}

      {(state === 'idle' || state === 'recording') && (
        <Button
          type="button"
          onClick={handleClick}
          aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
          className={`flex size-17 items-center justify-center rounded-full p-0 text-white shadow-button transition-all ${
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
          className="flex size-17 items-center justify-center rounded-full bg-action-default p-0 text-white opacity-50 shadow-button"
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
    </div>
  );
}
