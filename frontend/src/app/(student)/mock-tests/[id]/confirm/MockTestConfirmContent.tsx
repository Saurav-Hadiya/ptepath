'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Layers,
  ListChecks,
  Loader2,
  RefreshCw,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumb from '@/components/shared/Breadcrumb';
import EmptyState from '@/components/shared/EmptyState';
import { useMockTestTemplateDetail, useStartMockTest } from '@/hooks/queries/useMockTestQueries';
import { saveMockStart, clearMockResult } from '@/lib/mock-test-session';
import { ROUTES } from '@/config/routes';

const MODULE_LABELS: Record<string, string> = {
  speaking: 'Speaking',
  writing: 'Writing',
  reading: 'Reading',
  listening: 'Listening',
};

const RULES = [
  'You cannot return to a previous question once you move on',
  'The test auto-submits when the overall timer runs out',
  'Speaking and Writing questions carry their own time limits',
  'You can retake this test as many times as you like',
];

interface Props {
  templateId: string;
}

export default function MockTestConfirmContent({ templateId }: Props) {
  const router = useRouter();
  const { data: template, isLoading, isError, refetch } = useMockTestTemplateDetail(templateId);
  const startMutation = useStartMockTest();
  const [startError, setStartError] = useState(false);

  const handleStart = () => {
    if (startMutation.isPending) return;
    setStartError(false);
    startMutation.mutate(templateId, {
      onSuccess: (data) => {
        if (data.questions.length === 0) {
          setStartError(true);
          toast.error('This mock test has no questions available yet. Please try another.');
          return;
        }
        clearMockResult();
        saveMockStart(data);
        router.push(ROUTES.student.mockTests.attempt);
      },
      onError: (error: Error) => {
        setStartError(true);
        toast.error(error.message || 'Could not start the mock test. Please try again.');
      },
    });
  };

  if (isLoading) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Mock Tests', href: ROUTES.student.mockTests.home }, { label: 'Confirm' }]} />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-[120px] rounded-card" />
          <Skeleton className="h-[220px] rounded-card" />
        </div>
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Mock Tests', href: ROUTES.student.mockTests.home }, { label: 'Confirm' }]} />
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            icon={AlertTriangle}
            title="Could not load this mock test"
            description="It may have been removed or is temporarily unavailable."
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        </div>
      </div>
    );
  }

  const modules = [...new Set(template.questionRules.map((r) => r.module))];
  const moduleText = modules.map((m) => MODULE_LABELS[m] ?? m).join(' · ');

  const stats: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: ListChecks, label: 'Questions', value: String(template.totalQuestions) },
    { icon: Clock, label: 'Total time', value: `${template.totalTime} min` },
    { icon: Layers, label: 'Modules', value: String(modules.length) },
    { icon: RefreshCw, label: 'Retakes', value: 'Unlimited' },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumb items={[{ label: 'Mock Tests', href: ROUTES.student.mockTests.home }, { label: 'Confirm' }]} />

      <div className="mt-4 overflow-hidden rounded-card border border-border-default bg-bg-card shadow-card">
        <div className="flex items-start gap-3.5 border-b border-border-default bg-bg-page p-5 sm:p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-input bg-brand-primary text-primary-foreground">
            <Target className="size-5" />
          </span>
          <div>
            <span className="text-label-sm font-semibold tracking-wide text-action-default uppercase">
              Mock Test
            </span>
            <h1 className="font-display text-display-sm text-brand-primary">{template.name}</h1>
            <p className="mt-1 text-body-sm text-text-secondary">{template.description}</p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1.5 rounded-input border border-border-default bg-bg-page p-3 text-center"
              >
                <stat.icon className="mx-auto size-4 text-action-default" />
                <span className="text-display-sm text-brand-primary">{stat.value}</span>
                <span className="text-label-sm text-text-muted">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="rounded-card border border-border-default bg-bg-page p-4">
            <p className="mb-2.5 text-label-md font-semibold text-brand-primary">Before you begin</p>
            <ul className="space-y-2">
              {RULES.map((rule) => (
                <li key={rule} className="flex items-start gap-2.5 text-body-sm text-text-secondary">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-feedback-success/15">
                    <Check className="size-2.5 text-feedback-success" strokeWidth={3} />
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-label-sm text-text-muted">Covers {moduleText}.</p>

          {startError && (
            <p className="text-body-sm text-feedback-error">Something went wrong starting this test. Please try again.</p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-border-default p-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            variant="outline"
            disabled={startMutation.isPending}
            onClick={() => router.push(ROUTES.student.mockTests.home)}
            className="gap-1.5 border-border-default text-text-secondary hover:bg-bg-page sm:min-w-24"
          >
            <ArrowLeft className="size-4" />
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="gap-1.5 bg-action-default text-primary-foreground shadow-button hover:bg-action-hover sm:min-w-40"
          >
            {startMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Preparing test...
              </>
            ) : (
              <>
                Start Test
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
