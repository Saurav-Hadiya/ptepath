'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, KeyRound, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import AuthLayout from '@/components/shared/AuthLayout';
import PublicRoute from '@/components/shared/PublicRoute';
import { useForgotPassword } from '@/hooks/useAuth';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/config/routes';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const { mutate: forgotPassword, isPending, error } = useForgotPassword();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError('');

    const result = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!result.success) {
      setFieldError(result.error.flatten().fieldErrors.email?.[0] ?? 'Invalid email');
      return;
    }

    forgotPassword(result.data, { onSettled: () => setSubmitted(true) });
  }

  return (
    <PublicRoute>
      <AuthLayout badge="Password Reset">
        {submitted ? (
          /* Success state */
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-feedback-success-bg">
              <CheckCircle2 className="h-8 w-8 text-feedback-success" />
            </div>
            <h1 className="mb-2 font-display text-display-sm font-bold text-text-primary">
              Check your inbox
            </h1>
            <p className="mb-8 text-body-sm text-text-secondary">
              If <strong className="font-medium text-text-primary">{email}</strong> is registered,
              a password reset link has been sent. Check your inbox and spam folder.
            </p>
            <Link
              href={ROUTES.public.login}
              className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-bg-card px-5 py-2.5 text-label-md text-text-primary transition-colors hover:bg-bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-action-subtle">
              <KeyRound className="h-6 w-6 text-action-default" />
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="font-display text-display-sm font-bold text-text-primary">
                Forgot your password?
              </h1>
              <p className="mt-1.5 text-body-sm text-text-secondary">
                Enter your registered email and we will send you a reset link.
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
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-label-md text-text-primary">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`pl-10 text-body-sm ${fieldError ? 'border-feedback-error' : ''}`}
                    autoComplete="email"
                  />
                </div>
                {fieldError ? (
                  <p className="text-label-sm text-feedback-error">{fieldError}</p>
                ) : (
                  <p className="text-label-sm text-text-muted">
                    Enter the email your instructor registered for you.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="h-auto min-h-8 w-full whitespace-normal bg-action-default py-2.5 text-label-lg text-white shadow-button hover:bg-action-hover"
              >
                {isPending ? 'Sending...' : 'Send Reset Link'}
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
        )}
      </AuthLayout>
    </PublicRoute>
  );
}
