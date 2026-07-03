'use client';

import { Switch } from '@/components/ui/switch';

interface StatusToggleProps {
  isActive: boolean;
  onToggle: (newValue: boolean) => void;
  isLoading?: boolean;
}

export default function StatusToggle({ isActive, onToggle, isLoading = false }: StatusToggleProps) {
  return (
    <Switch
      checked={isActive}
      disabled={isLoading}
      onCheckedChange={onToggle}
      className="data-checked:bg-feedback-success data-unchecked:bg-text-muted"
    />
  );
}
