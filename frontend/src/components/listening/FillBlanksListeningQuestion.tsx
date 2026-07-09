'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import AudioPlayer, { AudioPlayerHandle } from '@/components/shared/AudioPlayer';
import AnswerResult from '@/components/shared/AnswerResult';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubmitListening } from '@/hooks/queries/useListeningQueries';
import type { ListeningQuestion, ListeningScoreResult, FillBlanksListeningBreakdown } from '@/types';

interface Props {
  question: ListeningQuestion;
  onScoreReceived: (score: ListeningScoreResult) => void;
}

const RESULT_INPUT_CLASS: Record<'exact' | 'close' | 'wrong', string> = {
  exact: 'border-feedback-success bg-feedback-success-bg text-feedback-success-text',
  close: 'border-feedback-warning bg-feedback-warning-bg text-feedback-warning-text',
  wrong: 'border-feedback-error bg-feedback-error-bg text-feedback-error-text',
};

export default function FillBlanksListeningQuestion({ question, onScoreReceived }: Props) {
  const blanks = question.blanks ?? [];
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<FillBlanksListeningBreakdown | null>(null);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const mutation = useSubmitListening();

  // Backend scores every blank independently (missing ones simply score 0), so
  // submission is never blocked on completeness — only on an in-flight request.
  const handleSubmit = () => {
    if (submitted || mutation.isPending) return;
    audioPlayerRef.current?.pause();
    const answersArray = blanks.map((_, i) => (answers[i] ?? '').trim());
    mutation.mutate(
      { questionId: question.id, questionType: 'fill_blanks', answers: answersArray },
      {
        onSuccess: (result) => {
          setBreakdown(result.breakdown as FillBlanksListeningBreakdown);
          setSubmitted(true);
          onScoreReceived(result);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  };

  const segments = (question.transcript ?? '').split('[BLANK]');

  return (
    <div className="space-y-5">
      <div>
        <p className="text-body-md text-text-secondary">
          Listen to the audio. Type the missing words into the blank spaces in the transcript below.
        </p>
        <p className="mt-1 text-label-sm text-text-muted">Minor spelling mistakes are accepted.</p>
      </div>

      <AudioPlayer ref={audioPlayerRef} audioUrl={question.audioUrl} playLimit={question.playLimit} />

      <div className="rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
        <p className="text-body-md leading-[2.4] text-text-primary">
          {segments.map((segment, i) => {
            const result = breakdown?.breakdown[i];
            return (
              <span key={i}>
                {segment}
                {i < blanks.length && (
                  <Input
                    value={answers[i] ?? ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                    disabled={submitted}
                    placeholder="..."
                    className={`mx-1 inline-flex h-8 w-20 min-w-20 px-2 align-middle text-body-sm sm:w-[120px] ${
                      result ? RESULT_INPUT_CLASS[result.result] : ''
                    }`}
                  />
                )}
              </span>
            );
          })}
        </p>
      </div>

      {breakdown && (
        <div className="space-y-2">
          {breakdown.breakdown.map((b) => (
            <AnswerResult key={b.blank} state={b.result === 'exact' ? 'correct' : b.result === 'close' ? 'missed' : 'wrong'}>
              {b.result === 'exact' && `Blank ${b.blank}: "${b.studentAnswer}" — Exact`}
              {b.result === 'close' && `Blank ${b.blank}: "${b.studentAnswer}" — Close (correct: "${b.correctAnswer}")`}
              {b.result === 'wrong' && `Blank ${b.blank}: "${b.studentAnswer || '(none)'}" — Wrong (correct: "${b.correctAnswer}")`}
            </AnswerResult>
          ))}
        </div>
      )}

      {!submitted && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your answers...' : 'Submit Answers'}
        </Button>
      )}
    </div>
  );
}
