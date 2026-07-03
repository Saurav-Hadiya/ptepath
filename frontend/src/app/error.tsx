'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-display text-display-lg text-brand-primary">Something went wrong</h1>
      <p className="text-body-md text-text-secondary">{error.message}</p>
      <button onClick={reset} className="text-body-md text-action-default hover:underline">
        Try again
      </button>
    </main>
  );
}
