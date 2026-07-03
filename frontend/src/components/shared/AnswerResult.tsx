import type { ReactNode } from 'react';
import { Check, X, TriangleAlert, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type AnswerResultState = 'correct' | 'wrong' | 'missed' | 'neutral';

interface AnswerResultProps {
  state: AnswerResultState;
  children: ReactNode;
}

const STATE_STYLES: Record<AnswerResultState, string> = {
  correct: 'border-feedback-success bg-feedback-success-bg text-feedback-success-text',
  wrong: 'border-feedback-error bg-feedback-error-bg text-feedback-error-text',
  missed: 'border-feedback-warning bg-feedback-warning-bg text-feedback-warning-text',
  neutral: 'border-border-default bg-bg-page text-text-primary',
};

const STATE_ICONS: Record<AnswerResultState, LucideIcon> = {
  correct: Check,
  wrong: X,
  missed: TriangleAlert,
  neutral: Minus,
};

export default function AnswerResult({ state, children }: AnswerResultProps) {
  const Icon = STATE_ICONS[state];

  return (
    <div
      className={`flex items-start gap-2.5 rounded-input border px-3.5 py-2.5 text-body-sm ${STATE_STYLES[state]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
      <span>{children}</span>
    </div>
  );
}
