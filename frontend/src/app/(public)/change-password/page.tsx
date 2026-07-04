'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import AuthLayout from '@/components/shared/AuthLayout';
import { useChangePassword } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { changePasswordSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/config/routes';

function getStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (!pwd) return 0;
  if (pwd.length < 6) return 1;
  const hasNum = /\d/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
  if (pwd.length >= 8 && hasNum && hasSpecial) return 4;
  if (pwd.length >= 8 && hasNum) return 3;
  return 2;
}

const STRENGTH_LABEL: Record<number, string> = { 0: '', 1: 'Too short', 2: 'Weak', 3: 'Good', 4: 'Strong' };
const STRENGTH_COLOR: Record<number, string> = {
  0: 'bg-border-default',
  1: 'bg-feedback-error',
  2: 'bg-feedback-warning',
  3: 'bg-feedback-success',
  4: 'bg-feedback-success',
};

export default function ChangePasswordPage() {
  const { firstLoginToken } = useAuthStore();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { mutate: changePassword, isPending, error } = useChangePassword();

  useEffect(() => {
    if (firstLoginToken === null) {
      router.replace(ROUTES.public.login);
    }
  }, [firstLoginToken, router]);

  const strength = getStrength(newPassword);
  const meetsLength = newPassword.length >= 8;
  const meetsNumber = /\d/.test(newPassword);

  if (!firstLoginToken) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = changePasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        errs[field] = msgs[0] ?? '';
      }
      setFieldErrors(errs);
      return;
    }

    changePassword({ newPassword, confirmPassword, firstLoginToken: firstLoginToken! });
  }

  return (
    <AuthLayout badge="First Login">
      {/* Welcome */}
      <div className="mb-7">
        <h1 className="font-display text-display-sm font-bold text-text-primary">
          Welcome to PTEPath!
        </h1>
        <p className="mt-1.5 text-body-sm text-text-secondary">
          Before you start practising, you need to set your own private password.
        </p>
      </div>

      {/* Warning */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-feedback-warning/30 bg-feedback-warning-bg px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-feedback-warning" />
        <p className="text-body-sm font-medium text-feedback-warning-text">
          You must set a private password before you can access the platform.
        </p>
      </div>

      {/* Info */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-action-default/15 bg-action-subtle px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-action-default" />
        <p className="text-body-sm text-text-secondary">
          Your account was created by your instructor with a temporary password. Set a new
          password that only you know to continue.
        </p>
      </div>

      {/* Server error */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-feedback-error/20 bg-feedback-error-bg p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-feedback-error" />
          <p className="text-body-sm text-feedback-error-text">{error.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-label-md text-text-primary">
            New password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Create a strong password"
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

          {newPassword.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
                      bar <= strength ? STRENGTH_COLOR[strength] : 'bg-border-default'
                    }`}
                  />
                ))}
              </div>
              {strength > 0 && (
                <p className={`text-label-sm ${strength <= 2 ? 'text-feedback-warning' : 'text-feedback-success'}`}>
                  {STRENGTH_LABEL[strength]}
                </p>
              )}
            </div>
          )}

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

        {/* Confirm */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-label-md text-text-primary">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
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
          {fieldErrors.confirmPassword && (
            <p className="text-label-sm text-feedback-error">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-action-default py-2.5 text-label-lg text-white shadow-button hover:bg-action-hover"
        >
          {isPending ? 'Setting password...' : 'Set Password and Continue'}
        </Button>
      </form>
    </AuthLayout>
  );
}
