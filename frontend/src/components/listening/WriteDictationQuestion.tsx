'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import AudioPlayer, { AudioPlayerHandle } from '@/components/shared/AudioPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubmitListening } from '@/hooks/queries/useListeningQueries';
import type { ListeningQuestion, ListeningScoreResult, WriteDictationBreakdown } from '@/types';

interface Props {
  question: ListeningQuestion;
  onScoreReceived: (score: ListeningScoreResult) => void;
}

const RESULT_ICON: Record<'exact' | 'close' | 'missed', string> = {
  exact: '✓ Exact',
  close: '~ Close',
  missed: '✗ Missed',
};

const RESULT_TEXT_CLASS: Record<'exact' | 'close' | 'missed', string> = {
  exact: 'text-feedback-success',
  close: 'text-feedback-warning',
  missed: 'text-feedback-error',
};

export default function WriteDictationQuestion({ question, onScoreReceived }: Props) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<WriteDictationBreakdown | null>(null);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const mutation = useSubmitListening();

  const handleSubmit = () => {
    if (!answer.trim() || submitted) return;
    audioPlayerRef.current?.pause();
    mutation.mutate(
      { questionId: question.id, questionType: 'write_dictation', answer: answer.trim() },
      {
        onSuccess: (result) => {
          setBreakdown(result.breakdown as WriteDictationBreakdown);
          setSubmitted(true);
          onScoreReceived(result);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-body-md text-text-secondary">Listen to the audio. Type exactly what you hear.</p>
        {question.playLimit !== 1 && (
          <p className="mt-1 text-label-sm text-text-muted">You may replay the audio while answering.</p>
        )}
      </div>

      <AudioPlayer ref={audioPlayerRef} audioUrl={question.audioUrl} playLimit={question.playLimit} />

      <div className="space-y-2">
        <label className="text-label-md text-text-secondary">Your Answer</label>
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={submitted}
          placeholder="Type what you hear..."
          className="h-11 border-border-default text-[16px] text-text-primary focus-visible:border-action-default sm:text-body-lg"
        />
      </div>

      {breakdown && (
        <div className="space-y-3">
          <p className="text-body-sm text-text-secondary">
            Correct sentence: <span className="font-medium text-text-primary">&ldquo;{breakdown.correctSentence}&rdquo;</span>
          </p>

          <div className="grid grid-cols-2 gap-3 rounded-card border border-border-default bg-bg-card p-4 text-body-sm shadow-card sm:grid-cols-3">
            <div>
              <p className="text-label-sm text-text-muted">Words Matched</p>
              <p className="font-semibold text-text-primary">
                {breakdown.matchedWords} / {breakdown.totalWords}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-text-muted">Exact Spelling</p>
              <p className="font-semibold text-text-primary">
                {breakdown.exactMatches} / {breakdown.totalWords}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-text-muted">Word Match Score</p>
              <p className="font-semibold text-text-primary">{breakdown.wordMatchScore}%</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-card border border-border-default">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-border-default bg-bg-page text-label-sm text-text-secondary">
                  <th className="p-2.5 text-left">Correct word</th>
                  <th className="p-2.5 text-left">Your word</th>
                  <th className="p-2.5 text-left">Result</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.breakdown.map((row, i) => (
                  <tr key={i} className="border-b border-border-default last:border-0">
                    <td className="p-2.5 text-text-primary">{row.correctWord}</td>
                    <td className="p-2.5 text-text-primary">{row.studentWord ?? '—'}</td>
                    <td className={`p-2.5 font-semibold ${RESULT_TEXT_CLASS[row.result]}`}>
                      {RESULT_ICON[row.result]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!submitted && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!answer.trim() || mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your answer...' : 'Submit'}
        </Button>
      )}
    </div>
  );
}
