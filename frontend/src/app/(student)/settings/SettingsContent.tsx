'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, Mail, User as UserIcon } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUpdatePassword } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { updatePasswordSchema } from '@/lib/validations/auth';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return initials.join('') || 'U';
}

export default function SettingsContent() {
  const { user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { mutate: updatePassword, isPending, error } = useUpdatePassword();

  const meetsLength = newPassword.length >= 8;
  const meetsNumber = /\d/.test(newPassword);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = updatePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        errs[field] = msgs[0] ?? '';
      }
      setFieldErrors(errs);
      return;
    }

    updatePassword(
      { currentPassword, newPassword, confirmPassword },
      {
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account details and password." />

      <Card>
        <CardHeader>
          <CardTitle className="text-label-lg text-text-primary">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-action-subtle text-label-lg font-semibold text-action-default">
              {user ? getInitials(user.name) : <UserIcon className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-body-md font-medium text-text-primary">{user?.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-body-sm text-text-secondary">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 sm:mt-6">
        <CardHeader>
          <CardTitle className="text-label-lg text-text-primary">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Current password */}
            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-label-md text-text-primary">
                Current Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className={`pl-10 pr-11 text-body-sm ${fieldErrors.currentPassword ? 'border-feedback-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.currentPassword && (
                <p className="text-label-sm text-feedback-error">{fieldErrors.currentPassword}</p>
              )}
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-label-md text-text-primary">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={`pl-10 pr-11 text-body-sm ${fieldErrors.newPassword ? 'border-feedback-error' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <ul className="mt-2 space-y-1">
                {[
                  { met: meetsLength, label: 'At least 8 characters' },
                  { met: meetsNumber, label: 'Contains a number' },
                ].map(({ met, label }) => (
                  <li
                    key={label}
                    className={`flex items-center gap-2 text-label-sm transition-colors ${met ? 'text-feedback-success' : 'text-text-muted'}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
              {fieldErrors.newPassword && (
                <p className="text-label-sm text-feedback-error">{fieldErrors.newPassword}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-label-md text-text-primary">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={`pl-10 pr-11 text-body-sm ${fieldErrors.confirmPassword ? 'border-feedback-error' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword ? (
                <p className="text-label-sm text-feedback-error">{fieldErrors.confirmPassword}</p>
              ) : (
                <p className="text-label-sm text-text-muted">Make sure both passwords match.</p>
              )}
            </div>

            {error && <p className="text-label-sm text-feedback-error">{error.message}</p>}

            <Separator />

            <Button
              type="submit"
              disabled={isPending}
              className="h-auto min-h-9 w-full whitespace-normal bg-action-default py-2.5 text-label-lg text-primary-foreground shadow-button hover:bg-action-hover sm:w-auto sm:min-w-48"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? 'Saving...' : 'Save New Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
