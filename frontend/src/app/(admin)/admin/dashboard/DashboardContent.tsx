'use client';

import { AlertTriangle, BarChart3, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';
import QuestionPreview from '@/components/admin/QuestionPreview';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAdminDashboardStats } from '@/hooks/queries/useAdminDashboardQueries';
import { formatRelativeTime, getInitials } from '@/lib/utils';

function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-feedback-success';
  if (score >= 50) return 'text-feedback-warning';
  return 'text-feedback-error';
}

function isRecentlyActive(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 30 * 60 * 1000;
}

export default function DashboardContent() {
  const { data, isLoading, isError, refetch } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Admin Dashboard" subtitle="Platform overview" />
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <Skeleton className="h-[320px] rounded-card" />
          <Skeleton className="h-[320px] rounded-card" />
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
          action={<Button onClick={() => refetch()}>Refresh</Button>}
        />
      </div>
    );
  }

  const { totalStudents, activeStudents, totalQuestions, attemptsToday, totalMockTestAttempts, recentLogins, lowestScoringQuestions } = data;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard value={totalStudents} label="Total Students" subtext={`${activeStudents} active`} subtextColor="success" />
        <StatCard value={totalQuestions} label="Total Questions" subtext="Across all modules" />
        <StatCard value={attemptsToday} label="Active Today" subtext="Students active today" />
        <StatCard value={totalMockTestAttempts} label="Mock Tests Attempted" subtext="All time" />
      </div>

      <div className="grid grid-cols-1 items-start gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-border-default bg-bg-card p-5">
          <div className="mb-3 font-display text-display-sm text-brand-primary">Recent Student Logins</div>
          {recentLogins.length === 0 ? (
            <EmptyState icon={Users} title="No recent logins" />
          ) : (
            <ul className="space-y-3">
              {recentLogins.slice(0, 10).map((login) => {
                const active = isRecentlyActive(login.lastActiveAt);
                return (
                  <li key={login.id} className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-avatar text-label-sm font-semibold text-action-default">
                      {getInitials(login.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body-sm font-semibold text-text-primary">{login.name}</div>
                      <div className="text-label-sm text-text-secondary">{formatRelativeTime(login.lastActiveAt)}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-4xl px-2 py-0.5 text-label-sm font-medium ${
                        active ? 'bg-feedback-success-bg text-feedback-success' : 'bg-bg-page text-text-muted'
                      }`}
                    >
                      {active ? 'Active' : 'Away'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-card border border-border-default bg-bg-card p-5">
          <div className="mb-3 font-display text-display-sm text-brand-primary">Lowest Scoring Questions</div>
          {lowestScoringQuestions.length === 0 ? (
            <EmptyState icon={BarChart3} title="Not enough attempts yet" />
          ) : (
            <ul className="space-y-3">
              {lowestScoringQuestions.slice(0, 5).map((question, index) => (
                <li key={question.id} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-page text-label-sm font-semibold text-text-secondary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <QuestionPreview content={question.content} maxLength={60} />
                    <div className="text-label-sm text-text-muted">
                      {question.module} · {question.attemptCount} attempts
                    </div>
                  </div>
                  <span className={`shrink-0 text-label-lg font-semibold ${scoreColorClass(question.avgScore)}`}>
                    {question.avgScore}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
