'use client';

interface TimerDisplayProps {
  seconds: number;
  totalSeconds: number;
  label?: string;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function TimerDisplay({ seconds, totalSeconds, label }: TimerDisplayProps) {
  const remainingRatio = totalSeconds > 0 ? seconds / totalSeconds : 0;
  const isDanger = remainingRatio < 0.1;
  const isWarning = !isDanger && remainingRatio < 0.2;

  return (
    <div>
      {label && <div className="mb-1.5 text-label-sm text-text-secondary">{label}</div>}
      <div
        className={`rounded-input border py-3 text-center font-display text-score-lg tracking-[2px] ${
          isDanger
            ? 'border-feedback-error/30 bg-feedback-error-bg text-feedback-error'
            : isWarning
              ? 'border-feedback-warning/30 bg-feedback-warning-bg text-feedback-warning'
              : 'border-border-default bg-bg-page text-brand-primary'
        }`}
      >
        {formatTime(seconds)}
      </div>
    </div>
  );
}
