'use client';

import { AlertTriangle, BarChart3, RefreshCw, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAdminDashboardStats } from '@/hooks/queries/useAdminDashboardQueries';
import { formatRelativeTime, getInitials } from '@/lib/utils';

const MODULE_COLORS: Record<string, string> = {
  speaking: 'bg-action-subtle text-module-speaking',
  writing: 'bg-action-subtle text-module-writing',
  reading: 'bg-action-subtle text-module-reading',
  listening: 'bg-action-subtle text-module-listening',
};

function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-feedback-success';
  if (score >= 50) return 'text-feedback-warning';
  return 'text-feedback-error';
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

  const { totalStudents, activeStudents, totalQuestions, attemptsToday, totalMockTestAttempts, recentLogins, lowestScoringTypes } = data;

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard value={totalStudents} label="Total Students" subtext={`${activeStudents} active`} subtextColor="success" />
        <StatCard value={totalQuestions} label="Total Questions" subtext="Across all modules" />
        <StatCard value={attemptsToday} label="Active Today" subtext="Students active today" />
        <StatCard value={totalMockTestAttempts} label="Mock Tests Attempted" subtext="All time" />
      </div>

      <div className="grid grid-cols-1 items-start gap-3 sm:gap-4 lg:grid-cols-2">
        {/* Recent Student Logins */}
        <div className="rounded-card border border-border-default bg-bg-card p-5">
          <div className="mb-3 font-display text-display-sm text-brand-primary">Recent Student Logins</div>
          {recentLogins.length === 0 ? (
            <EmptyState icon={Users} title="No recent logins" />
          ) : (
            <ul className="space-y-3">
              {recentLogins.slice(0, 10).map((login) => (
                <li key={login.id} className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-avatar text-label-sm font-semibold text-action-default">
                    {getInitials(login.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body-sm font-semibold text-text-primary">{login.name}</div>
                    <div className="text-label-sm text-text-secondary">{formatRelativeTime(login.lastActiveAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Lowest Scoring Question Types */}
        <div className="rounded-card border border-border-default bg-bg-card p-5">
          <div className="mb-3 font-display text-display-sm text-brand-primary">Lowest Scoring Question Types</div>
          {lowestScoringTypes.length === 0 ? (
            <EmptyState icon={BarChart3} title="Not enough attempts yet" />
          ) : (
            <ul className="space-y-3">
              {lowestScoringTypes.map((item, index) => (
                <li key={`${item.module}-${item.type}`} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-page text-label-sm font-semibold text-text-secondary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body-sm font-semibold text-text-primary">{item.label}</div>
                    <div className="flex items-center gap-1.5 text-label-sm text-text-muted">
                      <span className={`rounded px-1.5 py-0.5 text-label-sm font-medium capitalize ${MODULE_COLORS[item.module] ?? 'bg-bg-page text-text-muted'}`}>
                        {item.module}
                      </span>
                      <span>{item.attemptCount} attempts</span>
                    </div>
                  </div>
                  <span className={`shrink-0 text-label-lg font-semibold ${scoreColorClass(item.avgScore)}`}>
                    {item.avgScore}%
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
