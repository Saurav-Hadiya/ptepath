'use client';

import { useMemo } from 'react';
import { AlertCircle, BookOpen } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import QuestionTypeCard from '@/components/admin/QuestionTypeCard';
import { useAdminReadingHubList } from '@/hooks/queries/useAdminReadingQueries';
import { ROUTES } from '@/config/routes';
import { READING_TYPES } from './reading-types';
import type { AdminReadingQuestion } from '@/types';

interface TypeStats {
  count: number;
  avgScore: number | null;
}

export default function ReadingHubContent() {
  const { data, isLoading, isError, refetch } = useAdminReadingHubList();

  const statsByType = useMemo(() => {
    const map = new Map<string, TypeStats>();
    const questions: AdminReadingQuestion[] = data?.questions ?? [];
    for (const config of READING_TYPES) {
      const forType = questions.filter((q) => q.type === config.type);
      const count = forType.length;
      const avgScore =
        count > 0
          ? Math.round((forType.reduce((sum, q) => sum + q.avgScore, 0) / count) * 10) / 10
          : null;
      map.set(config.type, { count, avgScore });
    }
    return map;
  }, [data]);

  return (
    <main>
      <PageHeader
        title="Reading Question Bank"
        subtitle="Manage Fill in the Blanks, Multiple Choice, and Re-order Paragraphs reading exercises"
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load reading questions"
          description="Something went wrong while fetching the question bank."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {READING_TYPES.map((config) => {
            const stats = statsByType.get(config.type) ?? { count: 0, avgScore: null };
            return (
              <QuestionTypeCard
                key={config.type}
                href={ROUTES.admin.reading.type(config.type)}
                icon={BookOpen}
                label={config.label}
                description={config.description}
                count={stats.count}
                avgScore={stats.avgScore}
                accentClassName="border-t-module-reading"
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
