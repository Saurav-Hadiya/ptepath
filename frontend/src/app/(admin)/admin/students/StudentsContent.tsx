'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { Ban, CheckCircle, ChevronRight, Plus, Search, Trash2, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminStudents,
  useToggleStudentStatus,
  useDeleteStudent,
} from '@/hooks/queries/useAdminStudentQueries';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import type { AdminStudent } from '@/types';

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function StudentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('q') ?? '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [deleteTarget, setDeleteTarget] = useState<AdminStudent | null>(null);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  const debouncedUpdateSearch = useCallback(
    (value: string) => {
      if (value === urlSearch) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set('q', value.trim());
      else params.delete('q');
      const query = params.toString();
      router.replace(query ? `?${query}` : '?', { scroll: false });
    },
    [urlSearch, searchParams, router]
  );
  useDebouncedCallback(searchInput, debouncedUpdateSearch, 300);

  const { data, isLoading } = useAdminStudents(urlSearch);
  const toggleStatusMutation = useToggleStudentStatus();
  const deleteMutation = useDeleteStudent();

  const students = data?.students ?? [];
  const total = data?.total ?? students.length;

  function handleToggleStatus(student: AdminStudent, nextValue: boolean) {
    setToggleLoadingId(student.id);
    toggleStatusMutation.mutate(
      { id: student.id, isActive: nextValue },
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
        title="Students"
        subtitle={isLoading ? undefined : `${total} student${total === 1 ? '' : 's'} registered`}
        actions={
          <Button nativeButton={false} render={<Link href={ROUTES.admin.students.new} />} className="gap-1.5">
            <Plus className="size-4" />
            Add Student
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email"
          className="pl-9"
          aria-label="Search students by name or email"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-card" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={urlSearch ? 'No students match your search' : 'No students yet'}
          description={
            urlSearch ? 'Try a different name or email.' : 'Add your first student to get started.'
          }
          action={
            !urlSearch ? (
              <Button nativeButton={false} render={<Link href={ROUTES.admin.students.new} />} className="gap-1.5">
                <Plus className="size-4" />
                Add Student
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex flex-col gap-3 rounded-card border border-border-default bg-bg-card p-4 shadow-card sm:p-5"
            >
              {/* Top row: identity + status toggle */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link
                  href={ROUTES.admin.students.detail(student.id)}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action-subtle text-label-md font-bold text-action-default">
                    {initialsFor(student.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-body-sm font-semibold text-text-primary transition-colors group-hover:text-action-default">
                        {student.name}
                      </span>
                      <ChevronRight className="size-3.5 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="truncate text-label-sm text-text-secondary">{student.email}</div>
                  </div>
                </Link>

                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-semibold ${
                    student.isActive
                      ? 'bg-feedback-success-bg text-feedback-success'
                      : 'bg-feedback-error-bg text-feedback-error'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      student.isActive ? 'bg-feedback-success' : 'bg-feedback-error'
                    }`}
                  />
                  {student.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-label-sm">
                  {student.totalAttempts} attempt{student.totalAttempts !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="text-label-sm">
                  {student.totalMockTests} mock test{student.totalMockTests !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="text-label-sm">
                  Last active: {formatRelativeTime(student.lastActiveAt)}
                </Badge>
              </div>

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-2 border-t border-border-default pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={toggleLoadingId === student.id}
                  onClick={() => handleToggleStatus(student, !student.isActive)}
                  className={`gap-1.5 ${
                    student.isActive
                      ? 'text-feedback-warning hover:bg-feedback-warning-bg'
                      : 'text-feedback-success hover:bg-feedback-success-bg'
                  }`}
                >
                  {student.isActive ? (
                    <Ban className="size-3.5" />
                  ) : (
                    <CheckCircle className="size-3.5" />
                  )}
                  {toggleLoadingId === student.id
                    ? '...'
                    : student.isActive
                    ? 'Disable'
                    : 'Enable'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-feedback-error hover:bg-feedback-error-bg"
                  onClick={() => setDeleteTarget(student)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={ROUTES.admin.students.detail(student.id)} />}
                  className="ml-auto gap-1.5 text-action-default"
                >
                  View Details
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete this student?"
        description={`${deleteTarget?.name ?? 'This student'}'s account will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
