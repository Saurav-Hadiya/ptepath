'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle, LogIn, Loader2 } from 'lucide-react';
import AuthLayout from '@/components/shared/AuthLayout';
import PublicRoute from '@/components/shared/PublicRoute';
import { useLogin } from '@/hooks/useAuth';
import { loginSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/config/routes';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { mutate: login, isPending, error } = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        errs[field] = msgs[0] ?? '';
      }
      setFieldErrors(errs);
      return;
    }

    login(result.data);
  }

  return (
    <PublicRoute>
      <AuthLayout badge="Secure Login">
        {/* Icon */}
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-action-subtle">
          <LogIn className="h-6 w-6 text-action-default" />
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-display text-display-sm font-bold text-text-primary">Welcome back</h1>
          <p className="mt-1.5 text-body-sm text-text-secondary">
            Sign in to your PTEPath account to continue practising.
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
          {/* Email */}
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
                className={`pl-10 text-body-sm ${fieldErrors.email ? 'border-feedback-error' : ''}`}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-label-sm text-feedback-error">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <Label htmlFor="password" className="text-label-md text-text-primary">
                Password
              </Label>
              <Link
                href={ROUTES.public.forgotPassword}
                className="text-label-sm text-action-default transition-colors hover:text-action-hover"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`pl-10 pr-11 text-body-sm ${fieldErrors.password ? 'border-feedback-error' : ''}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-label-sm text-feedback-error">{fieldErrors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="mt-1 h-auto min-h-8 w-full whitespace-normal bg-action-default py-2.5 text-label-lg text-primary-foreground shadow-button hover:bg-action-hover"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-8 text-center text-body-sm text-text-muted">
          No account?{' '}
          <span className="text-text-secondary">Contact your instructor to get enrolled.</span>
        </p>
      </AuthLayout>
    </PublicRoute>
  );
}
