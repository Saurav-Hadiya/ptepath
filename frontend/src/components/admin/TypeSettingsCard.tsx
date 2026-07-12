'use client';

import type { ReactNode } from 'react';
import { Loader2, Pencil, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TypeSettingsCardProps {
  icon: LucideIcon;
  iconColorClass?: string;
  title: string;
  isLoading: boolean;
  isSaving: boolean;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  /** Read-only summary shown when not editing. */
  summary: ReactNode;
  /** Editable form fields shown while editing. */
  form: ReactNode;
}

/**
 * Shared shell for a module's "applies to every question of this type" settings
 * card (Speaking timing, Writing time limit, Listening play limit / time limit).
 * Values themselves come from the QuestionTypeConfig backend via each module's
 * own query hook — this component only owns the edit/view toggle chrome.
 */
export default function TypeSettingsCard({
  icon: Icon,
  iconColorClass = 'text-action-default',
  title,
  isLoading,
  isSaving,
  editing,
  onEdit,
  onSave,
  onCancel,
  summary,
  form,
}: TypeSettingsCardProps) {
  return (
    <div className="mb-4 rounded-card border border-border-default bg-bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${iconColorClass}`} />
          <span className="text-label-md font-semibold text-text-primary">{title}</span>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={onEdit} disabled={isLoading} className="gap-1.5">
            <Pencil className="size-3.5" />
            Edit
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isLoading ? (
            <span className="text-label-sm text-text-muted">Loading current settings...</span>
          ) : (
            <>
              {summary}
              <span className="text-label-sm text-text-muted">Applied to all questions of this type.</span>
            </>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {form}
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5">
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              {isSaving ? 'Saving...' : 'Apply to All Questions'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving} className="gap-1">
              <X className="size-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
