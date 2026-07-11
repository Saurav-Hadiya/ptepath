'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { TYPE_LABELS } from '@/components/shared/QuestionTypeBadge';
import type { TimerWarningLevel } from '@/hooks/useMockTestTimer';
import type { ModuleType } from '@/types';

interface Props {
  module: ModuleType;
  questionType: string;
  currentIndex: number;
  total: number;
  formattedTime: string;
  warningLevel: TimerWarningLevel;
  onExitClick: () => void;
}

const MODULE_LABELS: Record<ModuleType, string> = {
  speaking: 'Speaking',
  writing: 'Writing',
  reading: 'Reading',
  listening: 'Listening',
};

const TIMER_TEXT_CLASS: Record<TimerWarningLevel, string> = {
  none: 'text-text-primary',
  warning: 'text-feedback-warning',
  danger: 'text-feedback-error',
};

export default function MockTestHeader({
  module,
  questionType,
  currentIndex,
  total,
  formattedTime,
  warningLevel,
  onExitClick,
}: Props) {
  const typeLabel = TYPE_LABELS[questionType] ?? questionType;
  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <header className="shrink-0 border-b border-border-default bg-bg-card">
      <ProgressPrimitive.Root value={progressPercent} className="block w-full">
        <ProgressPrimitive.Track className="relative h-[3px] w-full overflow-hidden rounded-none bg-border-default">
          <ProgressPrimitive.Indicator className="h-full rounded-none bg-action-default transition-[width]" />
        </ProgressPrimitive.Track>
      </ProgressPrimitive.Root>

      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-label-sm font-semibold tracking-wide break-words text-text-muted uppercase">
            {MODULE_LABELS[module]} &middot; {typeLabel}
          </p>
          <p className="mt-0.5 text-body-sm text-text-secondary">
            Question {currentIndex + 1} of {total}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:shrink-0 sm:justify-end sm:gap-6">
          <button
            type="button"
            onClick={onExitClick}
            className="shrink-0 text-label-sm text-text-muted underline-offset-2 hover:text-text-secondary hover:underline"
          >
            Exit test
          </button>

          <div className="shrink-0 text-right">
            <p className="text-label-sm text-text-muted">Time remaining</p>
            <p className={`text-display-sm tabular-nums ${TIMER_TEXT_CLASS[warningLevel]}`}>{formattedTime}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
