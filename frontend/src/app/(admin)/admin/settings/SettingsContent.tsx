'use client';

import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdatePassword } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { adminChangePasswordSchema } from '@/lib/validations/admin';
import { getInitials } from '@/lib/utils';

export default function SettingsContent() {
  const { user } = useAuthStore();
  const { mutate: updatePassword, isPending, error } = useUpdatePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const adminName = user?.name ?? 'Admin';
  const adminEmail = user?.email ?? '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = adminChangePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        errs[field] = msgs[0] ?? '';
      }
      setFieldErrors(errs);
      return;
    }

    updatePassword(result.data, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
    });
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your admin account" />

      <div className="mb-6 max-w-xl rounded-card border border-border-default bg-bg-card p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-sidebar-admin-badge-border bg-sidebar-admin-badge-bg text-display-sm font-semibold text-brand-accent">
            {getInitials(adminName) || 'AD'}
          </span>
          <div className="min-w-0">
            <div className="text-body-lg font-semibold text-text-primary">{adminName}</div>
            <div className="truncate text-body-sm text-text-secondary">{adminEmail}</div>
            <span className="mt-1 inline-flex rounded-4xl border border-sidebar-admin-badge-border bg-sidebar-admin-badge-bg px-2 py-0.5 text-label-sm font-medium text-brand-accent">
              Admin
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-xl rounded-card border border-border-default bg-bg-card p-5">
        <div className="mb-4 font-display text-display-sm text-brand-primary">Change Password</div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-feedback-error/20 bg-feedback-error-bg p-3.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-feedback-error" />
            <p className="text-body-sm text-feedback-error-text">{error.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <PasswordField
            id="current-password"
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((v) => !v)}
            error={fieldErrors.currentPassword}
            autoComplete="current-password"
          />
          <PasswordField
            id="new-password"
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew((v) => !v)}
            error={fieldErrors.newPassword}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((v) => !v)}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />

          <Button
            type="submit"
            disabled={isPending}
            className="gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  autoComplete?: string;
}

function PasswordField({ id, label, value, onChange, show, onToggleShow, error, autoComplete }: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-label-md text-text-primary">
        {label}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-10"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-label-sm text-feedback-error">{error}</p>}
    </div>
  );
}
