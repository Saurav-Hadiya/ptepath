'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Clock, Mic, Plus, Search } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QuestionPreview from '@/components/admin/QuestionPreview';
import StatusToggle from '@/components/admin/StatusToggle';
import QuestionActionButtons from '@/components/admin/QuestionActionButtons';
import QuestionSearchInput from '@/components/admin/QuestionSearchInput';
import AdminTypeSettingsCard from '@/components/admin/TypeSettingsCard';
import {
  useAdminSpeakingList,
  useAdminSpeakingDelete,
  useAdminSpeakingToggleStatus,
  useAdminSpeakingTypeSettings,
  useAdminSpeakingUpdateTypeSettings,
} from '@/hooks/queries/useAdminSpeakingQueries';
import { ROUTES } from '@/config/routes';
import { getSpeakingTypeConfig, SPEAKING_TIME_BOUNDS, PREPARATION_TIME_BOUNDS } from '../speaking-types';
import type { AdminSpeakingQuestion } from '@/types';

function SpeakingTypeSettingsCard({ type }: { type: string }) {
  const config = getSpeakingTypeConfig(type);
  const settingsQuery = useAdminSpeakingTypeSettings(type);
  const updateMutation = useAdminSpeakingUpdateTypeSettings(type);

  const currentSpeakingTime = settingsQuery.data?.speakingTime ?? 0;
  const currentPrepTime = settingsQuery.data?.preparationTime ?? 0;

  const [editing, setEditing] = useState(false);
  const [speakingTime, setSpeakingTime] = useState(currentSpeakingTime);
  const [prepTime, setPrepTime] = useState(currentPrepTime);

  function openEdit() {
    setSpeakingTime(currentSpeakingTime);
    setPrepTime(currentPrepTime);
    setEditing(true);
  }

  function handleSave() {
    updateMutation.mutate(
      { speakingTime, ...(config?.hasPreparationTime ? { preparationTime: prepTime } : {}) },
      { onSuccess: () => setEditing(false) }
    );
  }

  return (
    <AdminTypeSettingsCard
      icon={Clock}
      iconColorClass="text-module-speaking"
      title="Type-wide Timing Settings"
      isLoading={settingsQuery.isLoading}
      isSaving={updateMutation.isPending}
      editing={editing}
      onEdit={openEdit}
      onSave={handleSave}
      onCancel={() => setEditing(false)}
      summary={
        <>
          <Badge variant="outline" className="text-label-sm">
            Speaking Time: {currentSpeakingTime}s
          </Badge>
          {config?.hasPreparationTime && (
            <Badge variant="outline" className="text-label-sm">
              Preparation Time: {currentPrepTime}s
            </Badge>
          )}
        </>
      }
      form={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-label-md">Speaking Time (seconds)</Label>
            <Input
              type="number"
              min={SPEAKING_TIME_BOUNDS.min}
              max={SPEAKING_TIME_BOUNDS.max}
              value={speakingTime}
              onChange={(e) => setSpeakingTime(Number(e.target.value))}
            />
            <p className="text-label-sm text-text-muted">
              {SPEAKING_TIME_BOUNDS.min}–{SPEAKING_TIME_BOUNDS.max}s
            </p>
          </div>
          {config?.hasPreparationTime && (
            <div className="space-y-1.5">
              <Label className="text-label-md">Preparation Time (seconds)</Label>
              <Input
                type="number"
                min={PREPARATION_TIME_BOUNDS.min}
                max={PREPARATION_TIME_BOUNDS.max}
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
              />
              <p className="text-label-sm text-text-muted">
                {PREPARATION_TIME_BOUNDS.min}–{PREPARATION_TIME_BOUNDS.max}s
              </p>
            </div>
          )}
        </div>
      }
    />
  );
}

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
  question: AdminSpeakingQuestion;
  type: string;
  onDelete: () => void;
  onToggle: (next: boolean) => void;
  isToggling: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border-default bg-bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {question.type === 'describe_image' ? (
            <span className="text-body-sm text-text-secondary">Uses an image prompt</span>
          ) : (
            <QuestionPreview content={question.content} maxLength={160} />
          )}
        </div>
        <StatusToggle isActive={question.isActive} onToggle={onToggle} isLoading={isToggling} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-label-sm">
          Speaking Time: {question.speakingTime}s
        </Badge>
        {question.preparationTime > 0 && (
          <Badge variant="outline" className="text-label-sm">
            Preparation Time: {question.preparationTime}s
          </Badge>
        )}
        <Badge variant="outline" className="text-label-sm">
          Attempts: {question.attemptCount}
        </Badge>
        <Badge variant="outline" className={`text-label-sm font-semibold ${scoreColorClass(question.avgScore)}`}>
          Avg Score: {question.avgScore}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border-default pt-3">
        <QuestionActionButtons editHref={ROUTES.admin.speaking.edit(type, question.id)} onDelete={onDelete} />
      </div>
    </div>
  );
}

function TypeListInner({ type }: { type: string }) {
  const config = getSpeakingTypeConfig(type);
  const searchParams = useSearchParams();
  const search = searchParams.get('q') ?? '';

  const { data, isLoading, isError, refetch } = useAdminSpeakingList(type, search);
  const deleteMutation = useAdminSpeakingDelete(type);
  const toggleMutation = useAdminSpeakingToggleStatus(type);

  const [deleteTarget, setDeleteTarget] = useState<AdminSpeakingQuestion | null>(null);

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
          render={<Link href={ROUTES.admin.speaking.home} />}
          className="gap-1.5 text-text-secondary"
        >
          <ArrowLeft className="size-3.5" />
          Back to Speaking Question Bank
        </Button>
      </div>

      <PageHeader
        title={config?.label ?? 'Speaking Questions'}
        subtitle={isLoading ? undefined : `${total} question${total === 1 ? '' : 's'}`}
        actions={
          <Button
            nativeButton={false}
            render={<Link href={ROUTES.admin.speaking.new(type)} />}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Add Question
          </Button>
        }
      />

      <SpeakingTypeSettingsCard type={type} />

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
          icon={Mic}
          title="No questions yet"
          description="Add the first question for this type to get started."
          action={
            <Button
              nativeButton={false}
              render={<Link href={ROUTES.admin.speaking.new(type)} />}
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
        description={
          deleteTarget?.type === 'describe_image'
            ? 'Are you sure you want to delete this question? The image will also be deleted from storage.'
            : 'Are you sure you want to delete this question?'
        }
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
