'use client';

import { useCallback, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AudioPlayer, { AudioPlayerHandle } from '@/components/shared/AudioPlayer';
import WordCounter from '@/components/shared/WordCounter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTimer } from '@/hooks/useTimer';
import { useSubmitListening } from '@/hooks/queries/useListeningQueries';
import { countWords } from '@/lib/word-counter';
import type { ListeningQuestion, ListeningScoreResult, SummariseSpokenBreakdown } from '@/types';

interface Props {
  question: ListeningQuestion;
  onScoreReceived: (score: ListeningScoreResult) => void;
}

// Mirrors the fixed bands baked into the backend's summariseWordCountScore
// (listening.scoring.ts) — informational only, never blocks submission.
const WORD_BAND_MIN = 50;
const WORD_BAND_MAX = 70;
const WORD_BAND_WARN = 30;

export default function SummariseSpokenQuestion({ question, onScoreReceived }: Props) {
  const [responseText, setResponseText] = useState('');
  const [phase, setPhase] = useState<'writing' | 'processing' | 'scored'>('writing');
  const [breakdown, setBreakdown] = useState<SummariseSpokenBreakdown | null>(null);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const hasStartedTimer = useRef(false);

  const wordCount = countWords(responseText);
  const canSubmit = wordCount > 0 && (phase as string) === 'writing';

  const mutation = useSubmitListening();

  const submit = useCallback(
    (text: string) => {
      audioPlayerRef.current?.pause();
      setPhase('processing');
      mutation.mutate(
        { questionId: question.id, questionType: 'summarise_spoken', answer: text },
        {
          onSuccess: (result) => {
            setPhase('scored');
            setBreakdown(result.breakdown as SummariseSpokenBreakdown);
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
    toast.info('Time is up — submitting your response...');
    submit(responseText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, responseText, submit]);

  const { seconds, start } = useTimer({
    initialSeconds: question.timeLimit ?? 0,
    onExpire: handleExpire,
    autoStart: false,
  });

  const handleAudioEnded = useCallback(() => {
    if (!hasStartedTimer.current && question.timeLimit) {
      hasStartedTimer.current = true;
      start();
    }
  }, [start, question.timeLimit]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponseText(e.target.value);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    submit(responseText);
  };

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timerActive = hasStartedTimer.current;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-md text-text-secondary">
          Listen to the audio. Write a 50–70 word summary of what you heard.
        </p>
        {!!question.timeLimit && (
          <span className="shrink-0 self-start rounded-pill border border-border-default bg-bg-page px-3 py-1 text-label-md font-semibold text-brand-primary tabular-nums sm:self-auto">
            {timerActive ? `${minutes}:${secs.toString().padStart(2, '0')}` : 'Timer starts after audio'}
          </span>
        )}
      </div>

      <AudioPlayer
        ref={audioPlayerRef}
        audioUrl={question.audioUrl}
        playLimit={question.playLimit}
        onEnded={handleAudioEnded}
      />

      <div className="space-y-2">
        <label className="text-label-md text-text-secondary">Your Summary</label>
        <Textarea
          value={responseText}
          onChange={handleChange}
          disabled={phase !== 'writing'}
          placeholder="Write your 50–70 word summary here..."
          className="min-h-[140px] border-border-default text-body-md text-text-primary focus-visible:border-action-default"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <WordCounter
            currentCount={wordCount}
            minCount={WORD_BAND_MIN}
            maxCount={WORD_BAND_MAX + 1}
            warnCount={WORD_BAND_WARN}
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

      {breakdown && (
        <div className="space-y-2 rounded-card border border-border-default bg-bg-card p-4 shadow-card sm:p-5">
          <div className="grid grid-cols-2 gap-3 text-body-sm sm:grid-cols-4">
            <div>
              <p className="text-label-sm text-text-muted">Words</p>
              <p className="font-semibold text-text-primary">{breakdown.wordCount}</p>
            </div>
            <div>
              <p className="text-label-sm text-text-muted">Word Count Score</p>
              <p className="font-semibold text-text-primary">{breakdown.wordCountScore}%</p>
            </div>
            <div>
              <p className="text-label-sm text-text-muted">Spelling Score</p>
              <p className="font-semibold text-text-primary">{breakdown.spellingScore}%</p>
            </div>
            <div>
              <p className="text-label-sm text-text-muted">Correct / Total Words</p>
              <p className="font-semibold text-text-primary">
                {breakdown.spellingResult.correct} / {breakdown.spellingResult.total}
              </p>
            </div>
          </div>

          {breakdown.misspelledWords.length > 0 && (
            <div className="rounded-input border border-feedback-warning/30 bg-feedback-warning-bg p-3 text-body-sm text-feedback-warning-text">
              <strong className="mb-1 block">Misspelled words</strong>
              {breakdown.misspelledWords.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
