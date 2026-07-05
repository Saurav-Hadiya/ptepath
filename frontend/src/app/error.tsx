'use client';

import Link from 'next/link';
import { Zap, ArrowLeft, RotateCcw } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-default bg-bg-card px-6 sm:px-8">
        <Logo size="md" variant="dark" />
        <Link
          href={ROUTES.public.login}
          className="inline-flex h-8 items-center rounded-lg bg-action-default px-4 text-label-md text-primary-foreground transition-colors hover:bg-action-hover"
        >
          Sign In
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-feedback-error-bg">
            <Zap className="h-8 w-8 text-feedback-error" />
          </div>
          <div className="mb-2 font-display text-display-xl font-extrabold tracking-tight text-feedback-error/20">
            500
          </div>
          <h1 className="mb-3 font-display text-display-sm font-bold text-text-primary">
            Something went wrong
          </h1>
          <p className="mb-6 text-body-md text-text-secondary">
            An unexpected error occurred. Our team has been notified and we are working on a fix.
          </p>

          {error.digest && (
            <div className="mb-8 w-full rounded-xl border border-feedback-error/20 bg-feedback-error-bg px-4 py-3">
              <p className="text-label-sm text-feedback-error-text">
                Reference: {error.digest} &mdash; contact your instructor if this persists.
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button
              onClick={reset}
              className="w-full bg-feedback-error text-label-md text-primary-foreground hover:bg-feedback-error/90 sm:w-auto"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link
              href={ROUTES.public.landing}
              className="inline-flex w-full items-center justify-center rounded-lg border border-border-default bg-bg-card px-5 py-2.5 text-label-md text-text-primary transition-colors hover:bg-bg-accent sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border-default bg-bg-card py-5 text-center">
        <p className="text-label-sm text-text-muted">
          &copy; {new Date().getFullYear()} PTEPath. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
