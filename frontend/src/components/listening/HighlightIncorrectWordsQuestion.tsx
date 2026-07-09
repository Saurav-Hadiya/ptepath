'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, TriangleAlert } from 'lucide-react';
import AudioPlayer, { AudioPlayerHandle } from '@/components/shared/AudioPlayer';
import { Button } from '@/components/ui/button';
import { useSubmitListening } from '@/hooks/queries/useListeningQueries';
import type { ListeningQuestion, ListeningScoreResult, HighlightIncorrectBreakdown } from '@/types';

interface Props {
  question: ListeningQuestion;
  onScoreReceived: (score: ListeningScoreResult) => void;
}

const WORD_STATE_CLASS: Record<'correct_click' | 'wrong_click' | 'missed' | 'neutral', string> = {
  correct_click: 'bg-feedback-success-bg text-feedback-success-text',
  wrong_click: 'bg-feedback-error-bg text-feedback-error-text line-through',
  missed: 'bg-feedback-warning-bg text-feedback-warning-text',
  neutral: 'text-text-primary',
};

export default function HighlightIncorrectWordsQuestion({ question, onScoreReceived }: Props) {
  const words = (question.transcript ?? '').split(/\s+/).filter(Boolean);
  const [clickedIndices, setClickedIndices] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<HighlightIncorrectBreakdown | null>(null);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const mutation = useSubmitListening();

  const toggleWord = (index: number) => {
    if (submitted) return;
    setClickedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSubmit = () => {
    if (submitted) return;
    audioPlayerRef.current?.pause();
    mutation.mutate(
      { questionId: question.id, questionType: 'highlight_incorrect', answers: Array.from(clickedIndices) },
      {
        onSuccess: (result) => {
          setBreakdown(result.breakdown as HighlightIncorrectBreakdown);
          setSubmitted(true);
          onScoreReceived(result);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  };

  const foundCount = breakdown?.wordResults.filter((w) => w.result === 'correct_click').length ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-body-md text-text-secondary">
          Listen to the audio. Click on the words in the transcript below that are DIFFERENT from what you hear
          in the audio.
        </p>
        <p className="mt-1 text-label-sm text-text-muted">Click a word to mark it. Click again to unmark.</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-input border border-feedback-warning/30 bg-feedback-warning-bg p-3 text-body-sm text-feedback-warning-text">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <span>Clicking a Incorrect word deducts points.</span>
      </div>

      <AudioPlayer ref={audioPlayerRef} audioUrl={question.audioUrl} playLimit={question.playLimit} />

      <div className="rounded-card border border-border-default bg-bg-page p-4 leading-[2.6] sm:p-5 sm:leading-loose">
        {words.map((word, i) => {
          const wordResult = breakdown?.wordResults.find((w) => w.index === i);
          const clicked = clickedIndices.has(i);
          const stateClass = wordResult
            ? WORD_STATE_CLASS[wordResult.result]
            : clicked
              ? 'bg-feedback-error-bg text-feedback-error underline'
              : 'text-text-primary hover:bg-feedback-warning-bg';

          return (
            <span key={i}>
              <span
                role="button"
                tabIndex={submitted ? -1 : 0}
                onClick={() => toggleWord(i)}
                className={`inline-block cursor-pointer rounded px-1.5 py-1.5 text-body-md transition-colors sm:px-1 sm:py-0.5 ${
                  submitted ? 'cursor-default' : ''
                } ${stateClass}`}
              >
                {word}
              </span>{' '}
            </span>
          );
        })}
      </div>

      {breakdown && (
        <p className="text-body-sm text-text-secondary">
          {foundCount} of {breakdown.totalIncorrect} incorrect words found
        </p>
      )}

      {!submitted && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your answer...' : 'Submit'}
        </Button>
      )}
    </div>
  );
}
