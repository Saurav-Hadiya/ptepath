'use client';

import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import QuestionTypeBadge from '@/components/shared/QuestionTypeBadge';
import WordCounter from '@/components/shared/WordCounter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTimer } from '@/hooks/useTimer';
import { useSubmitSummarise } from '@/hooks/queries/useWritingQueries';
import { countWords, enforceWordLimit } from '@/lib/word-counter';
import type { WritingQuestion, WritingScoreResult } from '@/types';

interface Props {
  question: WritingQuestion;
  onScoreReceived: (score: WritingScoreResult) => void;
}

export default function SummariseWrittenTextQuestion({ question, onScoreReceived }: Props) {
  const [responseText, setResponseText] = useState('');
  const [phase, setPhase] = useState<'writing' | 'processing' | 'scored'>('writing');

  const wordCount = countWords(responseText);
  // Backend never rejects for word count — it always scores whatever is submitted
  // (too short/long just scores low). The only hard requirement is non-empty text,
  // so submission is only blocked on that, never on the word-count band.
  const canSubmit = wordCount > 0 && (phase as string) === 'writing';
  const belowMin = wordCount > 0 && wordCount < question.wordMin;

  const mutation = useSubmitSummarise();

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
      wordCount >= question.wordMin
        ? 'Time is up — submitting your response...'
        : 'Time is up — your response has been submitted.'
    );
    submit(responseText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wordCount, question.wordMin, responseText, submit]);

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <QuestionTypeBadge type="summarise_written_text" module="writing" />
        <span className="shrink-0 rounded-pill border border-border-default bg-bg-page px-3 py-1 text-label-md font-semibold text-brand-primary tabular-nums">
          {minutes}:{secs.toString().padStart(2, '0')}
        </span>
      </div>

      <p className="text-body-md text-text-secondary">
        Read the passage below. Write ONE sentence summarising the main idea.
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
          placeholder="Write your one-sentence summary here..."
          className="min-h-[120px] border-border-default text-body-md text-text-primary focus-visible:border-action-default"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <WordCounter currentCount={wordCount} minCount={question.wordMin} maxCount={question.wordMax} />

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
