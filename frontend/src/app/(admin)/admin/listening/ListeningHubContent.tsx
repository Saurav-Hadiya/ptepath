'use client';

import { useMemo } from 'react';
import { AlertCircle, Headphones } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import QuestionTypeCard from '@/components/admin/QuestionTypeCard';
import { useAdminListeningHubList } from '@/hooks/queries/useAdminListeningQueries';
import { ROUTES } from '@/config/routes';
import { LISTENING_TYPES } from './listening-types';
import type { AdminListeningQuestion } from '@/types';

interface TypeStats {
  count: number;
  avgScore: number | null;
}

export default function ListeningHubContent() {
  const { data, isLoading, isError, refetch } = useAdminListeningHubList();

  const statsByType = useMemo(() => {
    const map = new Map<string, TypeStats>();
    const questions: AdminListeningQuestion[] = data?.questions ?? [];
    for (const config of LISTENING_TYPES) {
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
        title="Listening Question Bank"
        subtitle="Manage audio-based listening exercises across all 8 question types"
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load listening questions"
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
          {LISTENING_TYPES.map((config) => {
            const stats = statsByType.get(config.type) ?? { count: 0, avgScore: null };
            return (
              <QuestionTypeCard
                key={config.type}
                href={ROUTES.admin.listening.type(config.type)}
                icon={Headphones}
                label={config.label}
                description={config.description}
                count={stats.count}
                avgScore={stats.avgScore}
                accentClassName="border-t-module-listening"
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
