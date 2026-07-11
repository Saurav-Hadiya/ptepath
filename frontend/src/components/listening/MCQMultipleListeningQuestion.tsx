'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, TriangleAlert, SquareCheck } from 'lucide-react';
import AudioPlayer, { AudioPlayerHandle } from '@/components/shared/AudioPlayer';
import MCQOption from '@/components/shared/MCQOption';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubmitListening } from '@/hooks/queries/useListeningQueries';
import type { ListeningQuestion, ListeningScoreResult, MCQMultipleBreakdown, MCQResultState } from '@/types';

interface Props {
  question: ListeningQuestion;
  onScoreReceived: (score: ListeningScoreResult) => void;
}

const RESULT_MAP: Record<MCQResultState, 'correct' | 'wrong' | 'missed' | 'neutral'> = {
  correct_selected: 'correct',
  wrong_selected: 'wrong',
  missed: 'missed',
  neutral: 'neutral',
};

export default function MCQMultipleListeningQuestion({ question, onScoreReceived }: Props) {
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<MCQMultipleBreakdown | null>(null);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const mutation = useSubmitListening();

  const toggleLabel = (label: string) => {
    if (submitted) return;
    setSelectedLabels((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  };

  const handleSubmit = () => {
    if (selectedLabels.length === 0 || submitted) return;
    audioPlayerRef.current?.pause();
    mutation.mutate(
      { questionId: question.id, questionType: 'mcq_multiple', answers: selectedLabels },
      {
        onSuccess: (result) => {
          setBreakdown(result.breakdown as MCQMultipleBreakdown);
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
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="gap-1.5 rounded-pill border-none bg-brand-primary/10 px-2.5 py-1 text-label-sm font-semibold text-brand-primary">
          <SquareCheck className="size-3.5" />
          Select all that apply
        </Badge>
      </div>

      <p className="text-body-md text-text-secondary">
        Listen to the audio and select ALL correct answers. Negative marking applies.
      </p>

      <AudioPlayer ref={audioPlayerRef} audioUrl={question.audioUrl} playLimit={question.playLimit} />

      {question.question && <p className="text-body-md font-medium text-text-primary">{question.question}</p>}

      <div className="space-y-2">
        {options.map((opt) => {
          const optionResult = breakdown?.optionResults.find((o) => o.label === opt.label);
          return (
            <MCQOption
              key={opt.label}
              label={opt.label}
              text={opt.text}
              selected={optionResult ? optionResult.selected : selectedLabels.includes(opt.label)}
              disabled={submitted}
              resultState={optionResult ? RESULT_MAP[optionResult.result] : undefined}
              multiSelect
              onChange={toggleLabel}
            />
          );
        })}
      </div>

      {!submitted && (
        <div className="flex items-start gap-2.5 rounded-input border border-feedback-warning/30 bg-feedback-warning-bg p-3 text-body-sm text-feedback-warning-text">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>Selecting a wrong option deducts points. Only select options you are confident about.</span>
        </div>
      )}

      {!submitted && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={selectedLabels.length === 0 || mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your answers...' : 'Submit Answers'}
        </Button>
      )}
    </div>
  );
}
