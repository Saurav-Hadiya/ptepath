'use client';

import { useCallback, useState } from 'react';
import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import QuestionTypeBadge from '@/components/shared/QuestionTypeBadge';
import WordCounter from '@/components/shared/WordCounter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTimer } from '@/hooks/useTimer';
import { useSubmitEssay } from '@/hooks/queries/useWritingQueries';
import { countWords, enforceWordLimit } from '@/lib/word-counter';
import type { WritingQuestion, WritingScoreResult } from '@/types';

interface Props {
  question: WritingQuestion;
  onScoreReceived: (score: WritingScoreResult) => void;
}

const WARN_WORDS = 100;

export default function WriteEssayQuestion({ question, onScoreReceived }: Props) {
  const [responseText, setResponseText] = useState('');
  const [phase, setPhase] = useState<'writing' | 'processing' | 'scored'>('writing');

  const wordCount = countWords(responseText);
  // Backend never rejects for word count — it always scores whatever is submitted
  // (too short/long just scores low, per WORD_COUNT_BANDS in writing.scoring.ts).
  // The only hard requirement is non-empty text, so submission is only blocked on
  // that, never on the word-count band.
  const canSubmit = wordCount > 0 && (phase as string) === 'writing';

  const mutation = useSubmitEssay();

  const submit = useCallback(
    (text: string) => {
      setPhase('processing');
      mutation.mutate(
        { questionId: question.id, responseText: text },
        {
          onSuccess: (result) => {
            setPhase('scored');
            onScoreReceived(result);
          },
          onError: (error: Error) => {
            setPhase('writing');
            toast.error(error.message);
          },
        }
      );
    },
    [mutation, question.id, onScoreReceived]
  );

  const handleExpire = useCallback(() => {
    if (phase !== 'writing') return;
    toast.info(
      wordCount >= WARN_WORDS
        ? 'Time is up — submitting your response...'
        : 'Time is up — your response has been submitted.'
    );
    submit(responseText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wordCount, responseText, submit]);

  const { seconds } = useTimer({ initialSeconds: question.timeLimit, onExpire: handleExpire, autoStart: true });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setResponseText(countWords(value) >= question.wordMax ? enforceWordLimit(value, question.wordMax) : value);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    submit(responseText);
  };

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progressPercent = Math.min(100, Math.round((wordCount / question.wordMax) * 100));

  const progressBarColor =
    wordCount >= question.wordMax
      ? 'bg-feedback-error'
      : wordCount >= question.wordMin
        ? 'bg-feedback-success'
        : wordCount >= WARN_WORDS
          ? 'bg-feedback-warning'
          : 'bg-text-muted';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <QuestionTypeBadge type="write_essay" module="writing" />
        <span className="shrink-0 rounded-pill border border-border-default bg-bg-page px-3 py-1 text-label-md font-semibold text-brand-primary tabular-nums">
          {minutes}:{secs.toString().padStart(2, '0')}
        </span>
      </div>

      <p className="text-body-md text-text-secondary">
        Read the prompt below. Write a well-structured essay.
      </p>

      <div className="max-h-[180px] overflow-y-auto rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
        <p className="whitespace-pre-wrap text-body-md leading-[1.8] text-text-primary">{question.content}</p>
      </div>

      <div className="space-y-2">
        <label className="text-label-md text-text-secondary">Your Response</label>
        <Textarea
          value={responseText}
          onChange={handleChange}
          disabled={phase !== 'writing'}
          placeholder="Write your essay here..."
          className="min-h-[220px] border-border-default text-body-md text-text-primary focus-visible:border-action-default"
        />

        <ProgressPrimitive.Root value={progressPercent} className="block w-full">
          <ProgressPrimitive.Track className="relative h-1.5 w-full overflow-hidden rounded-full bg-border-default">
            <ProgressPrimitive.Indicator className={`h-full rounded-full transition-all ${progressBarColor}`} />
          </ProgressPrimitive.Track>
        </ProgressPrimitive.Root>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <WordCounter
            currentCount={wordCount}
            minCount={question.wordMin}
            maxCount={question.wordMax}
            warnCount={WARN_WORDS}
          />

          {phase !== 'scored' && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || phase === 'processing'}
              className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
            >
              {phase === 'processing' && <Loader2 className="size-4 animate-spin" />}
              {phase === 'processing' ? 'Checking your response...' : 'Submit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
