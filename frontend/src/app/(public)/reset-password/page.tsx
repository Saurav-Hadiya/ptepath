'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import AuthLayout from '@/components/shared/AuthLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useResetPassword, useRedirectIfAuthenticated } from '@/hooks/useAuth';
import { resetPasswordSchema } from '@/lib/validations/auth';
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

function ResetPasswordForm() {
  const { isChecking } = useRedirectIfAuthenticated();
  const params = useSearchParams();
  const token = params.get('token');
  const userId = params.get('id');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { mutate: resetPassword, isPending, error } = useResetPassword();

  const strength = getStrength(newPassword);
  const meetsLength = newPassword.length >= 8;
  const meetsNumber = /\d/.test(newPassword);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="md" label="Checking your session..." />
      </div>
    );
  }

  /* Invalid link */
  if (!token || !userId) {
    return (
      <>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-feedback-error-bg">
          <AlertCircle className="h-6 w-6 text-feedback-error" />
        </div>
        <div className="mb-8">
          <h1 className="font-display text-display-sm font-bold text-text-primary">Invalid reset link</h1>
          <p className="mt-1.5 text-body-sm text-text-secondary">
            This link is missing required information. Please request a new password reset link.
          </p>
        </div>
        <Link
          href={ROUTES.public.forgotPassword}
          className="inline-flex items-center rounded-lg bg-action-default px-5 py-2.5 text-label-md text-primary-foreground transition-colors hover:bg-action-hover"
        >
          Request New Link
        </Link>
      </>
    );
  }

  /* Success */
  if (success) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-feedback-success-bg">
          <CheckCircle2 className="h-8 w-8 text-feedback-success" />
        </div>
        <h1 className="mb-2 font-display text-display-sm font-bold text-text-primary">Password updated!</h1>
        <p className="mb-8 text-body-sm text-text-secondary">
          Your password has been changed. You can now sign in with your new credentials.
        </p>
        <Link
          href={ROUTES.public.login}
          className="inline-flex items-center rounded-lg bg-action-default px-6 py-2.5 text-label-md text-primary-foreground shadow-button transition-colors hover:bg-action-hover"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  /* Expired / invalid token error */
  const errorMsg = error?.message ?? '';
  const isExpired = /expired/i.test(errorMsg);
  if (error && !isPending) {
    return (
      <>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-feedback-error-bg">
          <AlertCircle className="h-6 w-6 text-feedback-error" />
        </div>
        <div className="mb-8">
          <h1 className="font-display text-display-sm font-bold text-text-primary">
            {isExpired ? 'Link expired' : 'Invalid link'}
          </h1>
          <p className="mt-1.5 text-body-sm text-text-secondary">{errorMsg}</p>
        </div>
        <Link
          href={ROUTES.public.forgotPassword}
          className="inline-flex items-center rounded-lg bg-action-default px-5 py-2.5 text-label-md text-primary-foreground transition-colors hover:bg-action-hover"
        >
          Request New Link
        </Link>
      </>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        errs[field] = msgs[0] ?? '';
      }
      setFieldErrors(errs);
      return;
    }

    resetPassword(
      { userId: userId!, token: token!, newPassword, confirmPassword },
      { onSuccess: () => setSuccess(true) },
    );
  }

  return (
    <>
      {/* Icon */}
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-action-subtle">
        <Lock className="h-6 w-6 text-action-default" />
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="font-display text-display-sm font-bold text-text-primary">Set a new password</h1>
        <p className="mt-1.5 text-body-sm text-text-secondary">
          Choose a strong password — at least 8 characters with a number.
        </p>
      </div>

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
              placeholder="At least 8 characters"
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

          {/* Strength bars */}
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

          {/* Requirements */}
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
              placeholder="Re-enter your password"
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
          className="h-auto min-h-8 w-full whitespace-normal bg-action-default py-2.5 text-label-lg text-primary-foreground shadow-button hover:bg-action-hover"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href={ROUTES.public.login}
          className="inline-flex items-center gap-1.5 text-label-sm text-text-muted transition-colors hover:text-text-secondary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout badge="Reset Password">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="md" label="Verifying your reset link..." />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
