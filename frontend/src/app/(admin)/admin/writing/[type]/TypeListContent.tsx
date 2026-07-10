'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, PenLine, Plus, Search } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import QuestionPreview from '@/components/admin/QuestionPreview';
import StatusToggle from '@/components/admin/StatusToggle';
import QuestionActionButtons from '@/components/admin/QuestionActionButtons';
import QuestionSearchInput from '@/components/admin/QuestionSearchInput';
import {
  useAdminWritingList,
  useAdminWritingDelete,
  useAdminWritingToggleStatus,
} from '@/hooks/queries/useAdminWritingQueries';
import { ROUTES } from '@/config/routes';
import { getWritingTypeConfig } from '../writing-types';
import type { AdminWritingQuestion } from '@/types';

function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-feedback-success';
  if (score >= 50) return 'text-feedback-warning';
  return 'text-feedback-error';
}

function QuestionCard({
  question,
  type,
  onDelete,
  onToggle,
  isToggling,
}: {
  question: AdminWritingQuestion;
  type: string;
  onDelete: () => void;
  onToggle: (next: boolean) => void;
  isToggling: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border-default bg-bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <QuestionPreview content={question.content} maxLength={160} />
        </div>
        <StatusToggle isActive={question.isActive} onToggle={onToggle} isLoading={isToggling} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-label-sm">
          Time Limit: {Math.round(question.timeLimit / 60)} min
        </Badge>
        <Badge variant="outline" className="text-label-sm">
          Attempts: {question.attemptCount}
        </Badge>
        <Badge variant="outline" className={`text-label-sm font-semibold ${scoreColorClass(question.avgScore)}`}>
          Avg Score: {question.avgScore}
        </Badge>
      </div>

      <p className="text-label-sm text-text-muted">
        Student responses must be between {question.wordMin}-{question.wordMax} words — automatically enforced
        by the system.
      </p>

      <div className="flex items-center justify-between gap-3 border-t border-border-default pt-3">
        <QuestionActionButtons editHref={ROUTES.admin.writing.edit(type, question.id)} onDelete={onDelete} />
      </div>
    </div>
  );
}

function TypeListInner({ type }: { type: string }) {
  const config = getWritingTypeConfig(type);
  const searchParams = useSearchParams();
  const search = searchParams.get('q') ?? '';

  const { data, isLoading, isError, refetch } = useAdminWritingList(type, search);
  const deleteMutation = useAdminWritingDelete(type);
  const toggleMutation = useAdminWritingToggleStatus(type);

  const [deleteTarget, setDeleteTarget] = useState<AdminWritingQuestion | null>(null);

  const questions = data?.questions ?? [];
  const total = data?.total ?? 0;

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  return (
    <main>
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.admin.writing.home} />}
          className="gap-1.5 text-text-secondary"
        >
          <ArrowLeft className="size-3.5" />
          Back to Writing Question Bank
        </Button>
      </div>

      <PageHeader
        title={config?.label ?? 'Writing Questions'}
        subtitle={isLoading ? undefined : `${total} question${total === 1 ? '' : 's'}`}
        actions={
          <Button
            nativeButton={false}
            render={<Link href={ROUTES.admin.writing.new(type)} />}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Add Question
          </Button>
        }
      />

      <div className="mb-4">
        <QuestionSearchInput placeholder="Search by question content..." />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState
          icon={AlertCircle}
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
          icon={Search}
          title="No results for this search"
          description={`No questions match "${search}". Try a different search term.`}
        />
      )}

      {!isLoading && !isError && questions.length === 0 && !search && (
        <EmptyState
          icon={PenLine}
          title="No questions yet"
          description="Add the first question for this type to get started."
          action={
            <Button
              nativeButton={false}
              render={<Link href={ROUTES.admin.writing.new(type)} />}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Question
            </Button>
          }
        />
      )}

      {!isLoading && !isError && questions.length > 0 && (
        <div className="flex flex-col gap-3">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              type={type}
              onDelete={() => setDeleteTarget(question)}
              onToggle={(next) => toggleMutation.mutate({ id: question.id, isActive: next })}
              isToggling={toggleMutation.isPending && toggleMutation.variables?.id === question.id}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Question"
        description="Are you sure you want to delete this question?"
        confirmLabel="Delete"
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}

export default function TypeListContent({ type }: { type: string }) {
  return (
    <Suspense fallback={<Skeleton className="h-32 rounded-card" />}>
      <TypeListInner type={type} />
    </Suspense>
  );
}
