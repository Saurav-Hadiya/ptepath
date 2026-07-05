'use client';

import { Check, X, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MCQResultState = 'correct' | 'wrong' | 'missed' | 'neutral';

interface MCQOptionProps {
  label: string;
  text: string;
  selected: boolean;
  disabled?: boolean;
  resultState?: MCQResultState;
  multiSelect?: boolean;
  onChange?: (label: string) => void;
}

const RESULT_CONTAINER_STYLES: Record<MCQResultState, string> = {
  correct: 'border-feedback-success bg-feedback-success-bg',
  wrong: 'border-feedback-error bg-feedback-error-bg',
  missed: 'border-feedback-warning bg-feedback-warning-bg',
  neutral: 'border-border-default bg-bg-page',
};

const RESULT_MARKER_STYLES: Record<MCQResultState, string> = {
  correct: 'border-feedback-success bg-feedback-success text-primary-foreground',
  wrong: 'border-feedback-error bg-feedback-error text-primary-foreground',
  missed: 'border-feedback-warning bg-feedback-warning text-primary-foreground',
  neutral: 'border-border-default bg-bg-card text-text-secondary',
};

const RESULT_LABEL: Partial<Record<MCQResultState, { text: string; icon: LucideIcon }>> = {
  correct: { text: 'Correct', icon: Check },
  wrong: { text: 'Wrong', icon: X },
  missed: { text: 'Missed', icon: TriangleAlert },
};

const RESULT_LABEL_STYLES: Record<MCQResultState, string> = {
  correct: 'text-feedback-success',
  wrong: 'text-feedback-error',
  missed: 'text-feedback-warning',
  neutral: 'text-text-muted',
};

export default function MCQOption({
  label,
  text,
  selected,
  disabled = false,
  resultState,
  multiSelect = false,
  onChange,
}: MCQOptionProps) {
  const handleClick = () => {
    if (disabled) return;
    onChange?.(label);
  };

  const containerClass = resultState
    ? RESULT_CONTAINER_STYLES[resultState]
    : selected
      ? 'border-action-default bg-action-subtle'
      : 'border-border-default bg-bg-card hover:border-action-default hover:bg-action-subtle';

  const markerClass = resultState
    ? RESULT_MARKER_STYLES[resultState]
    : selected
      ? 'border-action-default bg-action-default text-primary-foreground'
      : 'border-border-default bg-bg-card text-text-secondary';

  const resultInfo = resultState ? RESULT_LABEL[resultState] : undefined;
  const ResultIcon = resultInfo?.icon;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`h-auto w-full items-center justify-start gap-2.5 rounded-input border px-3.5 py-2.5 text-left whitespace-normal disabled:cursor-default disabled:opacity-100 ${containerClass}`}
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center border text-label-sm font-bold ${
          multiSelect ? 'rounded-lg' : 'rounded-full'
        } ${markerClass}`}
      >
        {label}
      </span>
      <span className="flex-1 text-body-sm font-normal text-text-primary">{text}</span>
      {resultInfo && ResultIcon && (
        <span
          className={`flex shrink-0 items-center gap-1 text-label-sm font-semibold ${RESULT_LABEL_STYLES[resultState as MCQResultState]}`}
        >
          <ResultIcon className="size-3.5" strokeWidth={2.5} />
          {resultInfo.text}
        </span>
      )}
    </Button>
  );
}
