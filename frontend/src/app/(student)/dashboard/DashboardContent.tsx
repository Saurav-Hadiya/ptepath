'use client';

import Link from 'next/link';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import ModuleCard from '@/components/shared/ModuleCard';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useDashboardStats } from '@/hooks/queries/useStudentQueries';
import { ROUTES } from '@/config/routes';
import type { ModuleType } from '@/types';

const MODULES: ModuleType[] = ['speaking', 'writing', 'reading', 'listening'];
const DASHBOARD_SUBTITLE = 'Welcome back. Your practice platform is ready.';

export default function DashboardContent() {
  const { data, isLoading, isError, refreshStats } = useDashboardStats();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Student Dashboard" subtitle={DASHBOARD_SUBTITLE} />

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-card" />
          ))}
        </div>

        <div className="mb-3 h-4 w-40">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-card" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <Skeleton className="h-[200px] rounded-card" />
          <Skeleton className="h-[200px] rounded-card" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={AlertTriangle}
          title="Could not load dashboard"
          description="Please refresh the page to try again."
          action={<Button onClick={() => refreshStats()}>Refresh</Button>}
        />
      </div>
    );
  }

  const { totalAttempts, totalMockTests, questionCounts, activeMockTests } = data;
  const totalQuestions =
    questionCounts.speaking + questionCounts.writing + questionCounts.reading + questionCounts.listening;

  return (
    <div>
      <PageHeader title="Student Dashboard" subtitle={DASHBOARD_SUBTITLE} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard value={totalQuestions} label="Total Questions Available" subtext="Across all modules" subtextColor="muted" />
        <StatCard value={20} label="Question Types" subtext="Speaking, Writing, Reading, Listening" subtextColor="muted" />
        <StatCard
          value={totalAttempts}
          label="Total Attempts"
          subtext={totalAttempts === 0 ? 'Start practising today' : 'Keep it up!'}
          subtextColor={totalAttempts === 0 ? 'muted' : 'success'}
        />
        <StatCard
          value={totalMockTests}
          label="Mock Tests Attempted"
          subtext={totalMockTests === 0 ? 'Try your first mock test' : 'All time'}
          subtextColor={totalMockTests === 0 ? 'muted' : 'success'}
        />
      </div>

      <div className="mb-3 font-display text-label-lg uppercase tracking-wide text-brand-primary">
        Practice Modules
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {MODULES.map((module) => (
          <ModuleCard
            key={module}
            module={module}
            questionCount={questionCounts[module]}
            href={ROUTES.student[module].home}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-border-default bg-bg-card p-5">
          <div className="mb-3 font-display text-display-sm text-brand-primary">Recent Activity</div>
          {totalAttempts === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No attempts yet"
              description="Start practising to see your activity here."
            />
          ) : (
            <p className="text-body-sm text-text-secondary">
              You have made {totalAttempts} total attempts across all modules.
            </p>
          )}
        </div>

        <div className="rounded-card bg-linear-to-br from-brand-primary to-brand-primary/80 p-5 text-primary-foreground">
          <div className="mb-3 font-display text-display-sm text-primary-foreground/70">Mock Tests</div>
          <p className="mb-4 text-body-sm leading-relaxed text-primary-foreground/60">
            Take a full-length mock test covering all four modules under real exam time pressure.
          </p>

          {activeMockTests === 0 ? (
            <>
              <Button disabled className="bg-primary-foreground text-brand-primary hover:bg-primary-foreground">
                Start Mock Test →
              </Button>
              <p className="mt-2 text-label-sm text-primary-foreground/50">
                No mock tests available yet. Contact your instructor.
              </p>
            </>
          ) : (
            <Button
              nativeButton={false}
              render={<Link href={ROUTES.student.mockTests.home} />}
              className="bg-primary-foreground text-brand-primary hover:bg-primary-foreground/90"
            >
              Start Mock Test →
            </Button>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-input border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-2.5">
              <div className="font-display text-label-lg font-extrabold text-primary-foreground">18+</div>
              <div className="text-label-sm text-primary-foreground/40">Questions</div>
            </div>
            <div className="rounded-input border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-2.5">
              <div className="font-display text-label-lg font-extrabold text-primary-foreground">Timed</div>
              <div className="text-label-sm text-primary-foreground/40">Real exam mode</div>
            </div>
            <div className="rounded-input border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-2.5">
              <div className="font-display text-label-lg font-extrabold text-primary-foreground">
                {activeMockTests} tests
              </div>
              <div className="text-label-sm text-primary-foreground/40">Available</div>
            </div>
            <div className="rounded-input border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-2.5">
              <div className="font-display text-label-lg font-extrabold text-primary-foreground">∞</div>
              <div className="text-label-sm text-primary-foreground/40">Retakes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
