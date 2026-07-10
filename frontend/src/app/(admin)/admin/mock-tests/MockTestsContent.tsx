'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { ClipboardList, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import StatusToggle from '@/components/admin/StatusToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useAdminMockTestList,
  useDeleteMockTestTemplate,
  useToggleMockTestStatus,
} from '@/hooks/queries/useAdminMockTestQueries';
import { ROUTES } from '@/config/routes';
import type { MockTestTemplate } from '@/types';

export default function MockTestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [deleteTarget, setDeleteTarget] = useState<MockTestTemplate | null>(null);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  const debouncedUpdateSearch = useCallback(
    (value: string) => {
      if (value === urlSearch) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set('search', value.trim());
      else params.delete('search');
      const query = params.toString();
      router.replace(query ? `?${query}` : '?', { scroll: false });
    },
    [urlSearch, searchParams, router]
  );
  useDebouncedCallback(searchInput, debouncedUpdateSearch, 300);

  const { data, isLoading } = useAdminMockTestList(urlSearch);
  const deleteMutation = useDeleteMockTestTemplate();
  const toggleStatusMutation = useToggleMockTestStatus();

  const templates = data?.templates ?? [];
  const total = data?.total ?? templates.length;

  function handleToggleStatus(template: MockTestTemplate, nextValue: boolean) {
    setToggleLoadingId(template.id);
    toggleStatusMutation.mutate(
      { id: template.id, isActive: nextValue },
      { onSettled: () => setToggleLoadingId(null) }
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  return (
    <div>
      <PageHeader
        title="Mock Tests"
        subtitle={isLoading ? undefined : `${total} template${total === 1 ? '' : 's'}`}
        actions={
          <Button
            nativeButton={false}
            render={<Link href={ROUTES.admin.mockTests.new} />}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Create Template
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by template name"
          className="pl-9"
          aria-label="Search mock test templates by name"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-card" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={urlSearch ? 'No templates match your search' : 'No mock test templates yet'}
          description={
            urlSearch ? 'Try a different template name.' : 'Create your first template to get started.'
          }
          action={
            !urlSearch ? (
              <Button nativeButton={false} render={<Link href={ROUTES.admin.mockTests.new} />} className="gap-1.5">
                <Plus className="size-4" />
                Create Template
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((template) => {
            const totalQuestions = template.questionRules.reduce((sum, r) => sum + r.count, 0);
            return (
              <div
                key={template.id}
                className="flex flex-col gap-3 rounded-card border border-border-default bg-bg-card p-4 shadow-card sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-action-subtle text-action-default">
                      <ClipboardList className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-body-sm font-semibold text-text-primary">
                        {template.name}
                      </div>
                      <div className="truncate text-label-sm text-text-secondary">
                        {template.description}
                      </div>
                    </div>
                  </div>
                  <StatusToggle
                    isActive={template.isActive}
                    isLoading={toggleLoadingId === template.id}
                    onToggle={(next) => handleToggleStatus(template, next)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-label-sm">
                    {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-label-sm">
                    {template.totalTime} min
                  </Badge>
                  <Badge variant="outline" className="text-label-sm">
                    {template.attemptCount} attempt{template.attemptCount !== 1 ? 's' : ''}
                  </Badge>
                  {template.attemptCount > 0 && (
                    <Badge
                      variant="outline"
                      className={`text-label-sm font-semibold ${
                        template.avgScore >= 80
                          ? 'text-feedback-success'
                          : template.avgScore >= 50
                          ? 'text-feedback-warning'
                          : 'text-feedback-error'
                      }`}
                    >
                      Avg Score: {template.avgScore}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border-default pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={ROUTES.admin.mockTests.edit(template.id)} />}
                    className="gap-1.5"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-feedback-error hover:bg-feedback-error-bg"
                    onClick={() => setDeleteTarget(template)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete this template?"
        description="Students will no longer be able to take this test. This cannot be undone."
        confirmLabel="Delete"
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
