'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-primary)' }}>
        Something went wrong
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>{error.message}</p>
      <button onClick={reset} style={{ color: 'var(--action-default)' }}>
        Try again
      </button>
    </main>
  );
}
