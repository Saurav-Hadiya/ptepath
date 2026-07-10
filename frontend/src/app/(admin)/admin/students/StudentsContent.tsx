'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { Ban, CheckCircle, KeyRound, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import SidePanel from '@/components/admin/SidePanel';
import StatusToggle from '@/components/admin/StatusToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAdminStudents,
  useCreateStudent,
  useUpdateStudent,
  useResetStudentPassword,
  useToggleStudentStatus,
  useDeleteStudent,
} from '@/hooks/queries/useAdminStudentQueries';
import {
  createStudentSchema,
  updateStudentSchema,
  resetPasswordAdminSchema,
} from '@/lib/validations/admin';
import { formatRelativeTime } from '@/lib/utils';
import type { AdminStudent } from '@/types';

type PanelMode = 'add' | 'edit' | null;

/** Two-letter initials chip content, e.g. "Jane Doe" -> "JD". */
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

  // Local input value updates immediately for a responsive feel; the URL (and
  // therefore the server-side query) only updates after a short debounce so
  // we don't spam router.replace / refetch on every keystroke.
  const [searchInput, setSearchInput] = useState(urlSearch);

  useEffect(() => {
    setSearchInput(urlSearch);
    // Only re-sync from the URL when it changes externally (e.g. back/forward navigation).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  const debouncedUpdateSearch = useCallback(
    (value: string) => {
      if (value === urlSearch) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('q', value.trim());
      } else {
        params.delete('q');
      }
      const query = params.toString();
      router.replace(query ? `?${query}` : '?', { scroll: false });
    },
    [urlSearch, searchParams, router]
  );

  useDebouncedCallback(searchInput, debouncedUpdateSearch, 300);

  const { data, isLoading } = useAdminStudents(urlSearch);
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const resetPasswordMutation = useResetStudentPassword();
  const toggleStatusMutation = useToggleStudentStatus();
  const deleteMutation = useDeleteStudent();

  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminStudent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStudent | null>(null);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [resetPassword, setResetPasswordValue] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const students = data?.students ?? [];
  const total = data?.total ?? students.length;

  function openAddPanel() {
    setPanelMode('add');
    setEditingStudent(null);
    setName('');
    setEmail('');
    setTemporaryPassword('');
    setFieldErrors({});
  }

  function openEditPanel(student: AdminStudent) {
    setPanelMode('edit');
    setEditingStudent(student);
    setName(student.name);
    setEmail(student.email);
    setFieldErrors({});
  }

  function closePanel() {
    setPanelMode(null);
    setEditingStudent(null);
    setFieldErrors({});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    if (panelMode === 'add') {
      const result = createStudentSchema.safeParse({ name, email, temporaryPassword });
      if (!result.success) {
        setFieldErrors(flattenErrors(result.error));
        return;
      }
      createMutation.mutate(result.data, { onSuccess: closePanel });
      return;
    }

    if (panelMode === 'edit' && editingStudent) {
      const result = updateStudentSchema.safeParse({ name, email });
      if (!result.success) {
        setFieldErrors(flattenErrors(result.error));
        return;
      }
      updateMutation.mutate(
        { id: editingStudent.id, payload: result.data },
        { onSuccess: closePanel }
      );
    }
  }

  function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const result = resetPasswordAdminSchema.safeParse({ temporaryPassword: resetPassword });
    if (!result.success) {
      setFieldErrors(flattenErrors(result.error));
      return;
    }
    if (!resetTarget) return;
    resetPasswordMutation.mutate(
      { id: resetTarget.id, temporaryPassword: result.data.temporaryPassword },
      {
        onSuccess: () => {
          setResetTarget(null);
          setResetPasswordValue('');
        },
      }
    );
  }

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

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${total} student${total === 1 ? '' : 's'} registered`}
        actions={
          <Button onClick={openAddPanel} className="gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover">
            <Plus className="size-4" />
            Add Student
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
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
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-card" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={urlSearch ? 'No students match your search' : 'No students yet'}
          description={urlSearch ? 'Try a different name or email.' : 'Add your first student to get started.'}
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-border-default bg-bg-card shadow-card">
          <div className="hidden gap-4 border-b border-border-default bg-bg-page px-5 py-3 text-label-sm font-bold tracking-wide text-text-secondary uppercase md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
            <span>Student</span>
            <span>Total Attempts</span>
            <span>Mock Tests</span>
            <span>Last Active</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <ul className="divide-y divide-border-default">
            {students.map((student) => (
              <li
                key={student.id}
                className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-bg-page md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-action-subtle text-label-md font-bold text-action-default">
                    {initialsFor(student.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-body-sm font-semibold text-text-primary">{student.name}</div>
                    <div className="truncate text-label-md text-text-secondary">{student.email}</div>
                  </div>
                </div>

                <div className="text-body-sm text-text-primary md:text-center">
                  <span className="text-label-sm text-text-muted md:hidden">Total Attempts: </span>
                  {student.totalAttempts}
                </div>

                <div className="text-body-sm text-text-primary md:text-center">
                  <span className="text-label-sm text-text-muted md:hidden">Mock Tests: </span>
                  {student.totalMockTests}
                </div>

                <div className="text-body-sm text-text-secondary">
                  <span className="text-label-sm text-text-muted md:hidden">Last Active: </span>
                  {formatRelativeTime(student.lastActiveAt)}
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-label-sm font-bold ${
                      student.isActive
                        ? 'bg-feedback-success-bg text-feedback-success'
                        : 'bg-feedback-error-bg text-feedback-error'
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${student.isActive ? 'bg-feedback-success' : 'bg-feedback-error'}`} />
                    {student.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-action-default hover:bg-action-subtle"
                    onClick={() => openEditPanel(student)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-feedback-warning hover:bg-feedback-warning-bg"
                    onClick={() => setResetTarget(student)}
                  >
                    <KeyRound className="size-3.5" />
                    Reset Password
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 ${
                      student.isActive
                        ? 'text-feedback-error hover:bg-feedback-error-bg'
                        : 'text-feedback-success hover:bg-feedback-success-bg'
                    }`}
                    onClick={() => handleToggleStatus(student, !student.isActive)}
                  >
                    {student.isActive ? <Ban className="size-3.5" /> : <CheckCircle className="size-3.5" />}
                    {student.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <StatusToggle
                    isActive={student.isActive}
                    isLoading={toggleLoadingId === student.id}
                    onToggle={(next) => handleToggleStatus(student, next)}
                  />
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
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <SidePanel
        isOpen={panelMode !== null}
        onClose={closePanel}
        title={panelMode === 'add' ? 'Add Student' : 'Edit Student'}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="student-name" className="text-label-md text-text-primary">
              Full Name
            </Label>
            <Input
              id="student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
            {fieldErrors.name && <p className="text-label-sm text-feedback-error">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="student-email" className="text-label-md text-text-primary">
              Email Address
            </Label>
            <Input
              id="student-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
            {fieldErrors.email && <p className="text-label-sm text-feedback-error">{fieldErrors.email}</p>}
          </div>

          {panelMode === 'add' && (
            <div className="space-y-1.5">
              <Label htmlFor="student-temp-password" className="text-label-md text-text-primary">
                Temporary Password
              </Label>
              <Input
                id="student-temp-password"
                type="text"
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
              <p className="text-label-sm text-text-muted">
                Student will be required to change this on first login.
              </p>
              {fieldErrors.temporaryPassword && (
                <p className="text-label-sm text-feedback-error">{fieldErrors.temporaryPassword}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-action-default text-primary-foreground hover:bg-action-hover"
          >
            {isSaving ? 'Saving...' : panelMode === 'add' ? 'Add Student' : 'Save Changes'}
          </Button>
        </form>
      </SidePanel>

      <Dialog
        open={resetTarget !== null}
        onOpenChange={(next) => {
          if (!next) {
            setResetTarget(null);
            setResetPasswordValue('');
            setFieldErrors({});
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-display-sm text-brand-primary">
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-body-sm text-text-secondary">
              Set a new temporary password for {resetTarget?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetSubmit} noValidate className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reset-password" className="text-label-md text-text-primary">
                Temporary Password
              </Label>
              <Input
                id="reset-password"
                type="text"
                value={resetPassword}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                placeholder="At least 6 characters"
              />
              {fieldErrors.temporaryPassword && (
                <p className="text-label-sm text-feedback-error">{fieldErrors.temporaryPassword}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="bg-action-default text-primary-foreground hover:bg-action-hover"
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete this student?"
        description={`${deleteTarget?.name ?? 'This student'}'s account will be permanently deleted.`}
        confirmLabel="Delete"
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function flattenErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const errs: Record<string, string> = {};
  for (const [field, msgs] of Object.entries(error.flatten().fieldErrors)) {
    errs[field] = msgs?.[0] ?? '';
  }
  return errs;
}
