'use client';

interface WordCounterProps {
  currentCount: number;
  minCount: number;
  maxCount: number;
  /** Optional mid threshold (e.g. essay: amber from 100 words before the green minimum at 200). */
  warnCount?: number;
}

export default function WordCounter({ currentCount, minCount, maxCount, warnCount }: WordCounterProps) {
  const colorClass =
    currentCount >= maxCount
      ? 'text-feedback-error'
      : currentCount >= minCount
        ? 'text-feedback-success'
        : warnCount !== undefined && currentCount >= warnCount
          ? 'text-feedback-warning'
          : 'text-text-muted';

  return (
    <span className={`text-label-md font-semibold ${colorClass}`}>
      {currentCount} / {maxCount} words
    </span>
  );
}
