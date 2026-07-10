'use client';

import { useMemo } from 'react';
import { AlertCircle, Mic } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import QuestionTypeCard from '@/components/admin/QuestionTypeCard';
import { useAdminSpeakingAllList } from '@/hooks/queries/useAdminSpeakingQueries';
import { ROUTES } from '@/config/routes';
import { SPEAKING_TYPES } from './speaking-types';
import type { AdminSpeakingQuestion } from '@/types';

interface TypeStats {
  count: number;
  avgScore: number | null;
}

export default function SpeakingHubContent() {
  const { data, isLoading, isError, refetch } = useAdminSpeakingAllList();

  const statsByType = useMemo(() => {
    const map = new Map<string, TypeStats>();
    const questions: AdminSpeakingQuestion[] = data?.questions ?? [];
    for (const config of SPEAKING_TYPES) {
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
        title="Speaking Question Bank"
        subtitle="Manage Read Aloud, Repeat Sentence, and other speaking question types"
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
          title="Couldn't load speaking questions"
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
          {SPEAKING_TYPES.map((config) => {
            const stats = statsByType.get(config.type) ?? { count: 0, avgScore: null };
            return (
              <QuestionTypeCard
                key={config.type}
                href={ROUTES.admin.speaking.type(config.type)}
                icon={Mic}
                label={config.label}
                description={config.description}
                count={stats.count}
                avgScore={stats.avgScore}
                accentClassName="border-t-module-speaking"
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
