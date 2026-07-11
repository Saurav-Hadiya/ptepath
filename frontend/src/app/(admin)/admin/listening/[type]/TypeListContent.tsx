'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Headphones, Pencil, Plus, SearchX, Volume2, X } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuestionPreview from '@/components/admin/QuestionPreview';
import QuestionSearchInput from '@/components/admin/QuestionSearchInput';
import QuestionActionButtons from '@/components/admin/QuestionActionButtons';
import StatusToggle from '@/components/admin/StatusToggle';
import {
  useAdminListeningList,
  useAdminListeningDelete,
  useAdminListeningToggleStatus,
  useAdminListeningUpdateTypeSettings,
} from '@/hooks/queries/useAdminListeningQueries';
import { ROUTES } from '@/config/routes';
import { getListeningTypeConfig } from '../listening-types';
import type { AdminListeningQuestion } from '@/types';

function PlayLimitSettingsCard({ type, questions }: { type: string; questions: AdminListeningQuestion[] }) {
  const updateMutation = useAdminListeningUpdateTypeSettings(type);
  const currentPlayLimit = questions[0]?.playLimit ?? 1;
  const [editing, setEditing] = useState(false);
  const [playLimit, setPlayLimit] = useState(currentPlayLimit);

  function openEdit() {
    setPlayLimit(currentPlayLimit);
    setEditing(true);
  }

  function handleSave() {
    updateMutation.mutate({ playLimit }, { onSuccess: () => setEditing(false) });
  }

  return (
    <div className="mb-4 rounded-card border border-border-default bg-bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Volume2 className="size-4 text-module-listening" />
          <span className="text-label-md font-semibold text-text-primary">Type-wide Audio Play Limit</span>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5">
            <Pencil className="size-3.5" />
            Edit
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-label-sm">
            {currentPlayLimit === 0 ? 'Unlimited replays' : 'Play once'}
          </Badge>
          <span className="text-label-sm text-text-muted">Applied to all questions of this type.</span>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <Select value={String(playLimit)} onValueChange={(v) => setPlayLimit(Number(v))}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Play once (recommended — matches the real exam)</SelectItem>
              <SelectItem value="0">Unlimited replays</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Apply to All Questions'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              disabled={updateMutation.isPending}
              className="gap-1"
            >
              <X className="size-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-feedback-success';
  if (score >= 50) return 'text-feedback-warning';
  return 'text-feedback-error';
}

function metaBadges(question: AdminListeningQuestion): string[] {
  const badges: string[] = [];
  switch (question.type) {
    case 'mcq_multiple':
    case 'mcq_single':
    case 'highlight_summary':
    case 'select_missing':
      badges.push(`${question.options.length} options`);
      break;
    case 'fill_blanks':
      badges.push(`${question.blanks.length} blank${question.blanks.length === 1 ? '' : 's'}`);
      break;
    case 'highlight_incorrect':
      badges.push(`${question.incorrectWordIndices.length} incorrect word${question.incorrectWordIndices.length === 1 ? '' : 's'}`);
      break;
    default:
      break;
  }
  badges.push(question.playLimit === 0 ? 'Unlimited plays' : 'Play once');
  return badges;
}

interface TypeListContentProps {
  type: string;
}

export default function TypeListContent({ type }: TypeListContentProps) {
  const config = getListeningTypeConfig(type);
  const searchParams = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const { data, isLoading, isError, refetch } = useAdminListeningList(type, search);
  const deleteMutation = useAdminListeningDelete(type);
  const toggleMutation = useAdminListeningToggleStatus(type);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const questions = data?.questions ?? [];

  return (
    <main>
      <Link
        href={ROUTES.admin.listening.home}
        className="mb-3 inline-flex items-center gap-1.5 text-label-sm text-text-secondary hover:text-action-default"
      >
        <ArrowLeft className="size-3.5" />
        Back to Listening Question Bank
      </Link>

      <PageHeader
        title={config?.label ?? type}
        subtitle={isLoading ? 'Loading...' : `${data?.total ?? 0} questions`}
        actions={
          <Button nativeButton={false} render={<Link href={ROUTES.admin.listening.new(type)} />} className="gap-1.5">
            <Plus className="size-4" />
            Add Question
          </Button>
        }
      />

      <PlayLimitSettingsCard type={type} questions={questions} />

      <div className="mb-4">
        <QuestionSearchInput placeholder="Search by question, transcript, or sentence..." />
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
          icon={Headphones}
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
          icon={Headphones}
          title="No questions yet"
          description="Add the first question for this type to get started."
          action={
            <Button nativeButton={false} render={<Link href={ROUTES.admin.listening.new(type)} />} className="gap-1.5">
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
                <QuestionPreview content={question.question ?? question.transcript ?? question.correctSentence} maxLength={140} />
                <audio controls src={question.audioUrl} className="h-8 w-full max-w-sm" />
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
                  editHref={ROUTES.admin.listening.edit(type, question.id)}
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
        description="This question and its audio recording will be permanently removed from storage."
        confirmLabel="Delete Question"
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}
