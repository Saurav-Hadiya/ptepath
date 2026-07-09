'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { ArrowRight, ChevronDown, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import QuestionTypeBadge from '@/components/shared/QuestionTypeBadge';
import ScoreDisplay from '@/components/shared/ScoreDisplay';
import StatCard from '@/components/shared/StatCard';
import MockQuestionDetailPanel from '@/components/mock-test/MockQuestionDetailPanel';
import { getMockResult, clearMockResult } from '@/lib/mock-test-session';
import { ROUTES } from '@/config/routes';
import type { ModuleType, MockTestResult } from '@/types';

const MODULE_ORDER: ModuleType[] = ['speaking', 'writing', 'reading', 'listening'];
const MODULE_LABELS: Record<ModuleType, string> = {
  speaking: 'Speaking',
  writing: 'Writing',
  reading: 'Reading',
  listening: 'Listening',
};

function scoreColor(score: number): string {
  if (score >= 80) return 'text-feedback-success';
  if (score >= 50) return 'text-feedback-warning';
  return 'text-feedback-error';
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-feedback-success';
  if (score >= 50) return 'bg-feedback-warning';
  return 'bg-feedback-error';
}

function overallFeedback(score: number): string {
  if (score >= 80) return 'Outstanding performance across every module.';
  if (score >= 50) return 'Solid effort — review the modules below to sharpen the weaker areas.';
  return 'Keep practising — focus on the modules scoring lowest first.';
}

/** Splits a "72 / 90" display string into its numeric part. */
function displayNumber(display: string): number {
  const n = Number(display.split('/')[0]?.trim());
  return Number.isFinite(n) ? n : 0;
}

export default function MockTestResultContent() {
  const router = useRouter();
  const [result, setResult] = useState<MockTestResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    setResult(getMockResult());
    setLoaded(true);
    // Intentionally no cleanup here: clearing sessionStorage on unmount would
    // also fire during React 18 Strict Mode's dev-only double-invoke of this
    // effect (mount → cleanup → mount), wiping the result before it ever
    // renders. The result is cleared only by the explicit "Try Again" action.
  }, []);

  // Global question numbers in module order (speaking → writing → reading → listening).
  const numberedModules = useMemo(() => {
    if (!result) return [];
    let counter = 0;
    return MODULE_ORDER.filter((m) => result.modules[m].questions.length > 0).map((module) => {
      const moduleResult = result.modules[module];
      const questions = moduleResult.questions.map((q) => ({ question: q, number: ++counter }));
      return { module, moduleResult, questions };
    });
  }, [result]);

  const totalQuestions = useMemo(
    () =>
      result ? MODULE_ORDER.reduce((sum, m) => sum + result.modules[m].questions.length, 0) : 0,
    [result]
  );

  if (!loaded) return null;

  if (!result) {
    return (
      <div>
        <PageHeader title="Mock Test Result" />
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            icon={Target}
            title="No test result found"
            description="Please take a mock test to see your results here."
            action={
              <Button onClick={() => router.push(ROUTES.student.mockTests.home)}>Go to Mock Tests</Button>
            }
          />
        </div>
      </div>
    );
  }

  const activeModuleCount = numberedModules.length;
  const overallScoreNumber = displayNumber(result.displayScore);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Mock Test Complete" subtitle="Here is how you performed across every module." />

      {/* Overall score hero */}
      <div className="mb-6 flex flex-col items-center gap-4 rounded-card bg-brand-primary p-6 text-center shadow-modal sm:p-8">
        <div>
          <p className="text-label-md text-white/60">Overall Score</p>
          <div className="mt-2 flex justify-center">
            <ScoreDisplay score={overallScoreNumber} size="lg" />
          </div>
        </div>
        <p className="max-w-md text-body-sm text-white/70">{overallFeedback(overallScoreNumber)}</p>
      </div>

      {/* Meta stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={`${result.questionsAnswered} / ${totalQuestions}`} label="Questions Answered" />
        <StatCard value={`${result.timeTaken} min`} label="Time Taken" />
        <StatCard value={String(activeModuleCount)} label="Modules Covered" />
      </div>

      {/* Module breakdown */}
      <h2 className="mb-3 font-display text-display-sm text-brand-primary">Module Breakdown</h2>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {numberedModules.map(({ module, moduleResult }) => {
          const moduleScoreNumber = displayNumber(moduleResult.displayScore);
          return (
            <div key={module} className="min-w-0 rounded-card border border-border-default bg-bg-card p-4 shadow-card">
              <p className="truncate text-label-sm text-text-muted uppercase">{MODULE_LABELS[module]}</p>
              <p className="mb-2 text-label-sm text-text-muted">
                {moduleResult.questions.length} question{moduleResult.questions.length === 1 ? '' : 's'}
              </p>
              <div className="mb-3">
                <ScoreDisplay score={moduleScoreNumber} size="md" />
              </div>
              <ProgressPrimitive.Root value={moduleResult.score} className="block w-full">
                <ProgressPrimitive.Track className="relative h-1.5 w-full overflow-hidden rounded-full bg-border-default">
                  <ProgressPrimitive.Indicator className={`h-full rounded-full ${barColor(moduleResult.score)}`} />
                </ProgressPrimitive.Track>
              </ProgressPrimitive.Root>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-col gap-2.5 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => setShowBreakdown((v) => !v)}
          className="gap-1.5 border-brand-primary text-brand-primary hover:bg-action-subtle"
        >
          <ChevronDown className={`size-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
          {showBreakdown ? 'Hide Question Breakdown' : 'View Question Breakdown'}
        </Button>
        <Button
          onClick={() => {
            clearMockResult();
            router.push(ROUTES.student.mockTests.home);
          }}
          className="gap-1.5 bg-brand-primary text-primary-foreground hover:bg-brand-primary/90"
        >
          Try Again
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* Question breakdown — each row expands inline, no dialog */}
      {showBreakdown && (
        <div className="space-y-6">
          {numberedModules.map(({ module, moduleResult, questions }) => (
            <div key={module}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-display-sm text-brand-primary">{MODULE_LABELS[module]}</h3>
                <span className={`text-label-md font-semibold ${scoreColor(moduleResult.score)}`}>
                  {moduleResult.displayScore}
                </span>
              </div>
              <div className="space-y-2">
                {questions.map(({ question, number }) => {
                  const rowKey = `${module}-${question.questionId}-${number}`;
                  const isExpanded = expandedKey === rowKey;
                  return (
                    <div
                      key={rowKey}
                      className="overflow-hidden rounded-card border border-border-default bg-bg-card shadow-card"
                    >
                      <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-input bg-bg-page text-label-md text-text-secondary">
                          {number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <QuestionTypeBadge type={question.questionType} module={module} />
                        </div>
                        <span className={`shrink-0 text-label-md font-semibold tabular-nums ${scoreColor(question.score)}`}>
                          {question.displayScore}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedKey(isExpanded ? null : rowKey)}
                          className="shrink-0 gap-1 border-border-default text-action-default hover:bg-action-subtle"
                        >
                          {isExpanded ? 'Hide' : 'View'} Details
                          <ChevronDown className={`size-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-border-default bg-bg-page p-3 sm:p-4">
                          <MockQuestionDetailPanel question={question} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
