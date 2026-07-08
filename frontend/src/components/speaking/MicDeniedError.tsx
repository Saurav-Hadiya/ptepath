'use client';

import { MicOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MicDeniedError() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-feedback-error/20 bg-feedback-error-bg p-6 text-center sm:p-8">
      <div className="flex size-14 items-center justify-center rounded-full bg-feedback-error/10">
        <MicOff className="size-7 text-feedback-error" />
      </div>

      <div>
        <h3 className="font-display text-display-sm text-text-primary">Microphone access required</h3>
        <p className="mt-1 text-body-sm text-text-secondary">
          PTEPath needs microphone access to record your speaking response.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-2 text-left text-body-sm text-text-secondary">
        <p>
          <strong className="text-text-primary">Chrome:</strong> Click the camera/mic icon in address
          bar, then select Allow.
        </p>
        <p>
          <strong className="text-text-primary">Safari:</strong> Go to Settings, then Safari, then
          Microphone, then Allow.
        </p>
        <p>
          <strong className="text-text-primary">Firefox:</strong> Click the microphone icon in address
          bar, then Allow.
        </p>
      </div>

      <Button
        onClick={() => window.location.reload()}
        className="mt-2 gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover"
      >
        <RefreshCw className="size-4" />
        Refresh Page
      </Button>
    </div>
  );
}
