'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmModal from '@/components/shared/ConfirmModal';
import MockTestHeader from '@/components/mock-test/MockTestHeader';
import MockTestQuestionRenderer from '@/components/mock-test/MockTestQuestionRenderer';
import { useMockTestState } from '@/hooks/useMockTestState';
import { useMockTestTimer } from '@/hooks/useMockTestTimer';
import { useSubmitMockTest } from '@/hooks/queries/useMockTestQueries';
import { saveMockResult } from '@/lib/mock-test-session';
import { ROUTES } from '@/config/routes';
import type { MockAnswerValue, MockTestStartData } from '@/types';

interface Props {
  startData: MockTestStartData;
}

export default function MockTestRunner({ startData }: Props) {
  const router = useRouter();
  const templateId = startData.templateId;
  const totalSeconds = startData.totalTime * 60;
  const totalQuestions = startData.questions.length;

  const {
    currentIndex,
    currentQuestion,
    isLastQuestion,
    isCurrentAnswered,
    setAnswer,
    setSpeakingScore,
    nextQuestion,
    skipQuestion,
    buildAnswersPayload,
  } = useMockTestState(startData.questions);

  const submitMutation = useSubmitMockTest();
  // Guards every exit path (submit success, explicit Exit, timer expiry) so
  // only one of them ever actually navigates away or fires a warning.
  const leavingRef = useRef(false);
  const [submitError, setSubmitError] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Latest submit fn, called by the timer's onExpire without stale closure issues.
  const submitRef = useRef<(auto: boolean) => void>(() => {});

  const { timeRemaining, formattedTime, warningLevel, stop } = useMockTestTimer({
    totalSeconds,
    onExpire: () => submitRef.current(true),
    autoStart: true,
  });

  const doSubmit = useCallback(
    (auto: boolean) => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setSubmitError(false);
      stop();

      const timeTaken = Math.min(
        startData.totalTime,
        Math.max(0, Math.floor((totalSeconds - timeRemaining) / 60))
      );

      submitMutation.mutate(
        { templateId, payload: { answers: buildAnswersPayload(), timeTaken } },
        {
          onSuccess: (result) => {
            saveMockResult(result);
            if (auto) toast.success('Time is up — your test has been submitted.');
            router.replace(ROUTES.student.mockTests.result);
          },
          onError: (error: Error) => {
            leavingRef.current = false;
            setSubmitError(true);
            toast.error(error.message || 'Could not submit your test. Please try again.');
          },
        }
      );
    },
    [stop, totalSeconds, timeRemaining, submitMutation, templateId, buildAnswersPayload, startData.totalTime, router]
  );

  submitRef.current = doSubmit;

  // Guards against advancing twice for the same question — e.g. the speaking
  // auto-advance below and a manual click landing in the same tick, or a
  // manual Skip racing it.
  const isAdvancingRef = useRef(false);

  useEffect(() => {
    isAdvancingRef.current = false;
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;
    if (isLastQuestion) {
      doSubmit(false);
      return;
    }
    nextQuestion();
  }, [isLastQuestion, doSubmit, nextQuestion]);

  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;

  const handleSkip = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;
    skipQuestion(currentIndex);
  }, [skipQuestion, currentIndex]);

  const handleAnswerChange = useCallback(
    (answer: MockAnswerValue | null) => setAnswer(currentIndex, answer),
    [setAnswer, currentIndex]
  );

  // Speaking is scored during the test with nothing further for the student
  // to do — by the time this fires, the recording was already captured and
  // evaluated (real async work the student already saw "Analysing your
  // response..." for), so there's nothing left to wait on. Advance the
  // moment the score arrives rather than padding it with an artificial delay.
  const handleSpeakingScored = useCallback(
    (score: number) => {
      setSpeakingScore(currentIndex, score);
      handleNextRef.current();
    },
    [setSpeakingScore, currentIndex]
  );

  const handleWritingExpired = useCallback(() => handleNextRef.current(), []);

  const handleExitConfirmed = useCallback(() => {
    leavingRef.current = true;
    stop();
    router.replace(ROUTES.student.mockTests.home);
  }, [stop, router]);

  // Scroll back to the top whenever the question changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [currentIndex]);

  // Warn before an actual page unload (refresh / close tab / URL bar navigation).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Intercept the browser Back button too — a client-side route change never
  // triggers `beforeunload`, so without this a student could tap Back and
  // silently abandon the test with zero warning.
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      if (leavingRef.current) return;
      window.history.pushState(null, '', window.location.href);
      setExitConfirmOpen(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!currentQuestion) return null;

  const isSubmitting = submitMutation.isPending;

  return (
    <div className="flex h-full flex-col">
      <MockTestHeader
        module={currentQuestion.module}
        questionType={currentQuestion.questionType}
        currentIndex={currentIndex}
        total={totalQuestions}
        formattedTime={formattedTime}
        warningLevel={warningLevel}
        onExitClick={() => setExitConfirmOpen(true)}
      />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto w-full max-w-[760px] px-4 py-8 sm:py-10">
          <MockTestQuestionRenderer
            key={currentIndex}
            question={currentQuestion}
            onAnswerChange={handleAnswerChange}
            onSpeakingScored={handleSpeakingScored}
            onWritingTimeExpired={handleWritingExpired}
          />
        </div>
      </div>

      <footer className="shrink-0 border-t border-border-default bg-bg-card px-4 py-3.5 sm:px-6">
        <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-3">
          {submitError ? (
            <span className="text-body-sm text-feedback-error">Submission failed. Please try again.</span>
          ) : !isLastQuestion ? (
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-body-sm text-text-muted underline-offset-2 hover:text-text-secondary hover:underline"
            >
              Skip this question
            </button>
          ) : (
            <span />
          )}

          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isLastQuestion ? (
              <>
                {!isSubmitting && <Send className="size-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </>
            ) : (
              <>
                Next Question
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </footer>

      <ConfirmModal
        open={exitConfirmOpen}
        onClose={() => setExitConfirmOpen(false)}
        onConfirm={handleExitConfirmed}
        title="Exit this test?"
        description="Your progress will be lost and can't be resumed. You'll need to start over from a fresh question set."
        confirmLabel="Exit test"
        isDanger
      />
    </div>
  );
}
