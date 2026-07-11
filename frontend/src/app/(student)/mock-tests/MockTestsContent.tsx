'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, Clock, ListChecks, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { useMockTestTemplates } from '@/hooks/queries/useMockTestQueries';
import { ROUTES } from '@/config/routes';
import type { ModuleType } from '@/types';

const MODULE_BADGES: Array<{ key: ModuleType; label: string; className: string }> = [
  { key: 'speaking', label: 'Speaking', className: 'bg-module-speaking/10 text-module-speaking' },
  { key: 'writing', label: 'Writing', className: 'bg-module-writing/10 text-module-writing' },
  { key: 'reading', label: 'Reading', className: 'bg-module-reading/10 text-module-reading' },
  { key: 'listening', label: 'Listening', className: 'bg-module-listening/10 text-module-listening' },
];

export default function MockTestsContent() {
  const router = useRouter();
  const { data: templates, isLoading, isError, refetch } = useMockTestTemplates();

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Mock Tests"
          subtitle="Full-length practice tests covering all four modules."
        />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-[168px] rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Mock Tests" subtitle="Full-length practice tests covering all four modules." />
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            icon={AlertTriangle}
            title="Could not load mock tests"
            description="Please refresh the page to try again."
            action={<Button onClick={() => refetch()}>Refresh</Button>}
          />
        </div>
      </div>
    );
  }

  const list = templates ?? [];

  return (
    <div>
      <PageHeader title="Mock Tests" subtitle="Full-length practice tests covering all four modules." />

      {list.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No mock tests available"
          description="Your instructor has not set up any mock tests yet."
        />
      ) : (
        <div className="space-y-4">
          {list.map((template) => {
            const modules = new Set(template.questionRules.map((r) => r.module));
            return (
              <div
                key={template.id}
                className="flex flex-col gap-4 rounded-card border border-border-default bg-bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-hover lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-display-sm text-brand-primary">{template.name}</h3>
                  <p className="mt-1 text-body-md text-text-secondary">{template.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {MODULE_BADGES.filter((m) => modules.has(m.key)).map((m) => (
                      <Badge
                        key={m.key}
                        className={`rounded-pill border-none px-2.5 py-0.5 text-label-sm font-semibold ${m.className}`}
                      >
                        {m.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 lg:flex-col lg:items-end lg:gap-3">
                  <div className="flex gap-4 lg:flex-col lg:items-end lg:gap-1">
                    <span className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary">
                      <Clock className="size-4 text-text-muted" />
                      {template.totalTime} min
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary">
                      <ListChecks className="size-4 text-text-muted" />
                      {template.totalQuestions} questions
                    </span>
                  </div>
                  <Button
                    onClick={() => router.push(ROUTES.student.mockTests.confirm(template.id))}
                    className="shrink-0 gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover"
                  >
                    Start Test
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
