'use client';

interface WordCounterProps {
  currentCount: number;
  minCount: number;
  maxCount: number;
}

export default function WordCounter({ currentCount, minCount, maxCount }: WordCounterProps) {
  const colorClass =
    currentCount >= maxCount
      ? 'text-feedback-error'
      : currentCount >= minCount
        ? 'text-feedback-success'
        : 'text-text-muted';

  return (
    <span className={`text-label-md font-semibold ${colorClass}`}>
      {currentCount} / {maxCount} words
    </span>
  );
}
