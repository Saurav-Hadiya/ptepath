'use client';

import { useCallback, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import QuestionTypeBadge from '@/components/shared/QuestionTypeBadge';
import WordCounter from '@/components/shared/WordCounter';
import { Textarea } from '@/components/ui/textarea';
import { useTimer } from '@/hooks/useTimer';
import { countWords, enforceWordLimit } from '@/lib/word-counter';
import type { MockTestQuestion } from '@/types';

interface Props {
  question: Extract<MockTestQuestion, { module: 'writing' }>;
  /** Reports the current response text (or null when empty) up to the attempt state. */
  onAnswerChange: (answer: string | null) => void;
  /** Called when the per-question writing timer expires — the attempt advances. */
  onTimeExpired: () => void;
}

// Amber warning band before the green minimum — only meaningful for Write Essay
// (min 200). Summarise Written Text's max (75) is below this, so it's omitted
// there instead of being dead logic that can never trigger.
const ESSAY_WARN_WORDS = 100;

export default function MockWritingQuestion({ question, onAnswerChange, onTimeExpired }: Props) {
  const data = question.questionData;
  const isEssay = question.questionType === 'write_essay';
  const [responseText, setResponseText] = useState('');
  const [locked, setLocked] = useState(false);
  const expiredRef = useRef(false);

  const wordCount = countWords(responseText);

  const handleExpire = useCallback(() => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    setLocked(true);
    toast.info('Time is up for this question — moving on.');
    onTimeExpired();
  }, [onTimeExpired]);

  const { seconds } = useTimer({
    initialSeconds: data.timeLimit,
    onExpire: handleExpire,
    autoStart: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    const value = countWords(raw) >= data.wordMax ? enforceWordLimit(raw, data.wordMax) : raw;
    setResponseText(value);
    onAnswerChange(value.trim().length > 0 ? value : null);
  };

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timerDanger = seconds <= 30;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <QuestionTypeBadge type={question.questionType} module="writing" />
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1 text-label-md font-semibold tabular-nums ${
            timerDanger
              ? 'border-feedback-error/30 bg-feedback-error-bg text-feedback-error'
              : 'border-border-default bg-bg-page text-brand-primary'
          }`}
        >
          <Clock className="size-3.5" />
          {minutes}:{secs.toString().padStart(2, '0')}
        </span>
      </div>

      <p className="text-body-md text-text-secondary">
        {isEssay
          ? 'Read the prompt below. Write a well-structured essay.'
          : 'Read the passage below. Write ONE sentence summarising the main idea.'}
      </p>

      <div className="max-h-[30vh] overflow-y-auto rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
        <p className="whitespace-pre-wrap text-body-md leading-[1.8] text-text-primary">{data.content}</p>
      </div>

      <div className="space-y-2">
        <label className="text-label-md text-text-secondary">Your Response</label>
        <Textarea
          value={responseText}
          onChange={handleChange}
          disabled={locked}
          placeholder={isEssay ? 'Write your essay here...' : 'Write your one-sentence summary here...'}
          className={`border-border-default text-body-md text-text-primary focus-visible:border-action-default ${
            isEssay ? 'min-h-[220px]' : 'min-h-[120px]'
          }`}
        />
        <WordCounter
          currentCount={wordCount}
          minCount={data.wordMin}
          maxCount={data.wordMax}
          warnCount={isEssay ? ESSAY_WARN_WORDS : undefined}
        />
      </div>
    </div>
  );
}
