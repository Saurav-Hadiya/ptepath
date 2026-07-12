'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  FileQuestion,
  KeyRound,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import FormSection from '@/components/admin/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminStudent,
  useUpdateStudent,
  useResetStudentPassword,
  useToggleStudentStatus,
  useDeleteStudent,
} from '@/hooks/queries/useAdminStudentQueries';
import { updateStudentSchema, resetPasswordAdminSchema } from '@/lib/validations/admin';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/config/routes';

function flattenErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const errs: Record<string, string> = {};
  for (const [field, msgs] of Object.entries(error.flatten().fieldErrors)) {
    errs[field] = msgs?.[0] ?? '';
  }
  return errs;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function StudentDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { data: student, isLoading, isError } = useAdminStudent(id);
  const updateMutation = useUpdateStudent();
  const resetPasswordMutation = useResetStudentPassword();
  const toggleStatusMutation = useToggleStudentStatus();
  const deleteMutation = useDeleteStudent();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [newPassword, setNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setEmail(student.email);
    }
  }, [student]);

  if (isLoading) {
    return (
      <main className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-48 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
      </main>
    );
  }

  if (isError || !student) {
    return (
      <main>
        <EmptyState
          icon={FileQuestion}
          title="Student not found"
          description="This student may have been deleted or the link is invalid."
          action={
            <Button nativeButton={false} render={<Link href={ROUTES.admin.students.home} />}>
              Back to Students
            </Button>
          }
        />
      </main>
    );
  }

  function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    setEditErrors({});
    const result = updateStudentSchema.safeParse({ name, email });
    if (!result.success) {
      setEditErrors(flattenErrors(result.error));
      return;
    }
    updateMutation.mutate(
      { id, payload: result.data },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  }

  function handleEditCancel() {
    setName(student!.name);
    setEmail(student!.email);
    setEditErrors({});
    setIsEditing(false);
  }

  function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setPasswordErrors({});
    const result = resetPasswordAdminSchema.safeParse({ temporaryPassword: newPassword });
    if (!result.success) {
      setPasswordErrors(flattenErrors(result.error));
      return;
    }
    resetPasswordMutation.mutate(
      { id, temporaryPassword: result.data.temporaryPassword },
      { onSuccess: () => setNewPassword('') }
    );
  }

  function handleToggleStatus() {
    toggleStatusMutation.mutate({ id, isActive: !student!.isActive });
    setShowDisableConfirm(false);
  }

  function handleDelete() {
    deleteMutation.mutate(id, {
      onSuccess: () => router.push(ROUTES.admin.students.home),
    });
  }

  return (
    <main className="pb-12">
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.admin.students.home} />}
          className="gap-1.5 text-text-secondary"
        >
          <ArrowLeft className="size-3.5" />
          Back to Students
        </Button>
      </div>

      <PageHeader title={student.name} subtitle="Student account details and management" />

      {/* Profile card */}
      <div className="mb-4 flex flex-col gap-4 rounded-card border border-border-default bg-bg-card p-5 shadow-card sm:flex-row sm:items-center sm:gap-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-action-subtle text-display-sm font-bold text-action-default">
          {initialsFor(student.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-display-sm font-bold text-text-primary">{student.name}</div>
          <div className="text-body-sm text-text-secondary">{student.email}</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-semibold ${
                student.isActive
                  ? 'bg-feedback-success-bg text-feedback-success'
                  : 'bg-feedback-error-bg text-feedback-error'
              }`}
            >
              <span className={`size-1.5 rounded-full ${student.isActive ? 'bg-feedback-success' : 'bg-feedback-error'}`} />
              {student.isActive ? 'Active' : 'Disabled'}
            </span>
            {student.isFirstLogin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-feedback-warning-bg px-2.5 py-0.5 text-label-sm font-semibold text-feedback-warning">
                Awaiting first login
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-3 sm:gap-6">
          <Stat label="Attempts" value={student.totalAttempts} />
          <Stat label="Mock Tests" value={student.totalMockTests} />
          <div className="col-span-2 sm:col-span-1">
            <div className="text-label-sm text-text-muted">Last Active</div>
            <div className="mt-0.5 text-body-sm font-medium text-text-primary">
              {formatRelativeTime(student.lastActiveAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <FormSection title="Profile">
        {isEditing ? (
          <form onSubmit={handleEditSave} noValidate className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {editErrors.name && (
                  <p className="text-label-sm text-feedback-error">{editErrors.name}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {editErrors.email && (
                  <p className="text-label-sm text-feedback-error">{editErrors.email}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={updateMutation.isPending} className="gap-1.5">
                {updateMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleEditCancel} className="gap-1.5">
                <X className="size-3.5" />
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-label-sm text-text-muted mb-0.5">Full Name</div>
                <div className="text-body-sm font-medium text-text-primary">{student.name}</div>
              </div>
              <div>
                <div className="text-label-sm text-text-muted mb-0.5">Email Address</div>
                <div className="text-body-sm font-medium text-text-primary">{student.email}</div>
              </div>
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" />
                Edit Profile
              </Button>
            </div>
          </div>
        )}
      </FormSection>

      {/* Reset password */}
      <div className="mt-4">
        <FormSection title="Reset Password">
          <form onSubmit={handlePasswordReset} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">New Temporary Password</Label>
              <Input
                id="new-password"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters and 1 number"
                autoComplete="new-password"
                className="max-w-sm"
              />
              <p className="text-label-sm text-text-muted">
                The student will be required to change this password on their next login.
              </p>
              {passwordErrors.temporaryPassword && (
                <p className="text-label-sm text-feedback-error">{passwordErrors.temporaryPassword}</p>
              )}
            </div>
            <div>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={resetPasswordMutation.isPending}
                className="gap-1.5"
              >
                {resetPasswordMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <KeyRound className="size-3.5" />
                )}
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </FormSection>
      </div>

      {/* Account status + danger zone */}
      <div className="mt-4">
        <FormSection title="Account Management">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="text-body-sm font-medium text-text-primary">
                {student.isActive ? 'Disable Account' : 'Enable Account'}
              </div>
              <p className="text-label-sm text-text-muted">
                {student.isActive
                  ? 'Disabling will prevent this student from logging in. This can be reversed at any time.'
                  : 'Re-enabling will allow this student to log in again.'}
              </p>
              <div className="mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={toggleStatusMutation.isPending}
                  onClick={() => setShowDisableConfirm(true)}
                  className={`gap-1.5 ${
                    student.isActive
                      ? 'text-feedback-warning hover:bg-feedback-warning-bg'
                      : 'text-feedback-success hover:bg-feedback-success-bg'
                  }`}
                >
                  {toggleStatusMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : student.isActive ? (
                    <Ban className="size-3.5" />
                  ) : (
                    <CheckCircle className="size-3.5" />
                  )}
                  {toggleStatusMutation.isPending
                    ? 'Updating...'
                    : student.isActive
                    ? 'Disable Account'
                    : 'Enable Account'}
                </Button>
              </div>
            </div>

            <div className="border-t border-border-default pt-4 flex flex-col gap-1.5">
              <div className="text-body-sm font-medium text-feedback-error">Delete Account</div>
              <p className="text-label-sm text-text-muted">
                Permanently delete this student account and all associated data. This cannot be undone.
              </p>
              <div className="mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-1.5 text-feedback-error hover:bg-feedback-error-bg"
                >
                  <Trash2 className="size-3.5" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </FormSection>
      </div>

      <ConfirmModal
        open={showDisableConfirm}
        onClose={() => setShowDisableConfirm(false)}
        onConfirm={handleToggleStatus}
        title={student.isActive ? 'Disable this account?' : 'Enable this account?'}
        description={
          student.isActive
            ? `${student.name} will no longer be able to log in. You can re-enable them at any time.`
            : `${student.name} will be able to log in again.`
        }
        confirmLabel={student.isActive ? 'Disable' : 'Enable'}
        isDanger={student.isActive}
        isLoading={toggleStatusMutation.isPending}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete this student?"
        description={`${student.name}'s account will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-label-sm text-text-muted">{label}</div>
      <div className="mt-0.5 text-display-sm font-bold text-text-primary">{value}</div>
    </div>
  );
}
