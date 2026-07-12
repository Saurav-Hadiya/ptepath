'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export default function ReadingAttemptError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Reading attempt crashed:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong with this question"
        description="An unexpected error interrupted your attempt. Your progress on this question wasn't saved — try again."
        action={<Button onClick={reset}>Try Again</Button>}
      />
    </div>
  );
}
