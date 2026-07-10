'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Plus, SearchX } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import QuestionPreview from '@/components/admin/QuestionPreview';
import QuestionSearchInput from '@/components/admin/QuestionSearchInput';
import QuestionActionButtons from '@/components/admin/QuestionActionButtons';
import StatusToggle from '@/components/admin/StatusToggle';
import {
  useAdminReadingList,
  useAdminReadingDelete,
  useAdminReadingToggleStatus,
} from '@/hooks/queries/useAdminReadingQueries';
import { ROUTES } from '@/config/routes';
import { getReadingTypeConfig } from '../reading-types';
import type { AdminReadingQuestion } from '@/types';

function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-feedback-success';
  if (score >= 50) return 'text-feedback-warning';
  return 'text-feedback-error';
}

function metaBadges(question: AdminReadingQuestion): string[] {
  switch (question.type) {
    case 'rw_fill_blanks':
    case 'reading_fill_blanks':
      return [`${question.blanks.length} blank${question.blanks.length === 1 ? '' : 's'}`];
    case 'mcq_multiple':
    case 'mcq_single':
      return [`${question.options.length} options`];
    case 'reorder_paragraphs':
      return [`${question.paragraphs.length} paragraphs`];
    default:
      return [];
  }
}

interface TypeListContentProps {
  type: string;
}

export default function TypeListContent({ type }: TypeListContentProps) {
  const config = getReadingTypeConfig(type);
  const searchParams = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const { data, isLoading, isError, refetch } = useAdminReadingList(type, search);
  const deleteMutation = useAdminReadingDelete(type);
  const toggleMutation = useAdminReadingToggleStatus(type);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const questions = data?.questions ?? [];

  return (
    <main>
      <Link
        href={ROUTES.admin.reading.home}
        className="mb-3 inline-flex items-center gap-1.5 text-label-sm text-text-secondary hover:text-action-default"
      >
        <ArrowLeft className="size-3.5" />
        Back to Reading Question Bank
      </Link>

      <PageHeader
        title={config?.label ?? type}
        subtitle={isLoading ? 'Loading...' : `${data?.total ?? 0} questions`}
        actions={
          <Button nativeButton={false} render={<Link href={ROUTES.admin.reading.new(type)} />} className="gap-1.5">
            <Plus className="size-4" />
            Add Question
          </Button>
        }
      />

      <div className="mb-4">
        <QuestionSearchInput placeholder="Search by passage text..." />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState
          icon={BookOpen}
          title="Couldn't load questions"
          description="Something went wrong while fetching this list."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )}

      {!isLoading && !isError && questions.length === 0 && search && (
        <EmptyState
          icon={SearchX}
          title="No matching questions"
          description={`No questions match "${search}". Try a different search term.`}
        />
      )}

      {!isLoading && !isError && questions.length === 0 && !search && (
        <EmptyState
          icon={BookOpen}
          title="No questions yet"
          description="Add the first question for this type to get started."
          action={
            <Button nativeButton={false} render={<Link href={ROUTES.admin.reading.new(type)} />} className="gap-1.5">
              <Plus className="size-4" />
              Add Question
            </Button>
          }
        />
      )}

      {!isLoading && !isError && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((question) => (
            <div
              key={question.id}
              className="flex flex-col gap-3 rounded-card border border-border-default bg-bg-card p-4 shadow-card sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <QuestionPreview content={question.passage} maxLength={140} />
                <div className="flex flex-wrap items-center gap-2">
                  {metaBadges(question).map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))}
                  <Badge variant="outline">
                    {question.attemptCount} attempt{question.attemptCount === 1 ? '' : 's'}
                  </Badge>
                  {question.attemptCount > 0 && (
                    <span className={`text-label-sm font-semibold ${scoreColorClass(question.avgScore)}`}>
                      Avg {question.avgScore}/90
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <StatusToggle
                  isActive={question.isActive}
                  isLoading={toggleMutation.isPending}
                  onToggle={(next) => toggleMutation.mutate({ id: question.id, isActive: next })}
                />
                <QuestionActionButtons
                  editHref={ROUTES.admin.reading.edit(type, question.id)}
                  onDelete={() => setPendingDeleteId(question.id)}
                  deleteDisabled={deleteMutation.isPending}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteMutation.mutate(pendingDeleteId, { onSuccess: () => setPendingDeleteId(null) });
          }
        }}
        title="Delete this question?"
        description="This question will be permanently removed from the reading question bank."
        confirmLabel="Delete Question"
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}
