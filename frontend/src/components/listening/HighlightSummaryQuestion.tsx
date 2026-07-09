'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import AudioPlayer, { AudioPlayerHandle } from '@/components/shared/AudioPlayer';
import { Button } from '@/components/ui/button';
import { useSubmitListening } from '@/hooks/queries/useListeningQueries';
import type { ListeningQuestion, ListeningScoreResult, MCQSingleBreakdown } from '@/types';

interface Props {
  question: ListeningQuestion;
  onScoreReceived: (score: ListeningScoreResult) => void;
}

export default function HighlightSummaryQuestion({ question, onScoreReceived }: Props) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<MCQSingleBreakdown | null>(null);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const mutation = useSubmitListening();

  const handleSubmit = () => {
    if (!selectedLabel || submitted) return;
    audioPlayerRef.current?.pause();
    mutation.mutate(
      { questionId: question.id, questionType: 'highlight_summary', answer: selectedLabel },
      {
        onSuccess: (result) => {
          setBreakdown(result.breakdown as MCQSingleBreakdown);
          setSubmitted(true);
          onScoreReceived(result);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  };

  const options = question.options ?? [];

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Listen to the audio. Select the paragraph that best summarises what you heard.
      </p>

      <AudioPlayer ref={audioPlayerRef} audioUrl={question.audioUrl} playLimit={question.playLimit} />

      <div className="space-y-2.5">
        {options.map((opt) => {
          const optionResult = breakdown?.optionResults.find((o) => o.label === opt.label);
          let stateClass = 'border-border-default bg-bg-card hover:border-action-default hover:bg-action-subtle';
          if (optionResult) {
            stateClass = optionResult.isCorrect
              ? 'border-feedback-success bg-feedback-success-bg'
              : optionResult.selected
                ? 'border-feedback-error bg-feedback-error-bg'
                : 'border-border-default bg-bg-page';
          } else if (selectedLabel === opt.label) {
            stateClass = 'border-action-default bg-action-subtle';
          }

          const selected = optionResult ? optionResult.selected : selectedLabel === opt.label;

          return (
            <button
              key={opt.label}
              type="button"
              disabled={submitted}
              aria-pressed={selected}
              onClick={() => !submitted && setSelectedLabel(opt.label)}
              className={`flex w-full items-start gap-3 rounded-input border p-3.5 text-left transition-colors disabled:cursor-default sm:p-4 ${stateClass}`}
            >
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-label-sm font-bold ${
                  selected
                    ? 'border-action-default bg-action-default text-primary-foreground'
                    : 'border-border-default bg-bg-card text-text-secondary'
                }`}
              >
                {opt.label}
              </span>
              <span className="flex-1 text-body-sm leading-[1.7] text-text-primary">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedLabel || mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your answer...' : 'Submit Answer'}
        </Button>
      )}
    </div>
  );
}
