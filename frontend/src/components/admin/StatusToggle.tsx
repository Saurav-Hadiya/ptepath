'use client';

import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface StatusToggleProps {
  isActive: boolean;
  onToggle: (newValue: boolean) => void;
  isLoading?: boolean;
}

export default function StatusToggle({ isActive, onToggle, isLoading = false }: StatusToggleProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <Switch
        checked={isActive}
        disabled={isLoading}
        onCheckedChange={onToggle}
        className="data-checked:bg-feedback-success data-unchecked:bg-text-muted"
      />
      {isLoading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-text-muted" />}
    </div>
  );
}
