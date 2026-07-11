'use client';

import { useRef } from 'react';
import { PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface BlankableTextareaProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  hint?: string;
}

/**
 * A textarea with an "Insert [BLANK]" button that inserts the marker at the
 * current cursor position. A live preview below highlights each [BLANK]
 * marker so admins can clearly see where blanks will appear for students.
 */
export default function BlankableTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
  error,
  hint,
}: BlankableTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertBlank() {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + '[BLANK]');
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + '[BLANK]' + value.slice(end);
    onChange(next);
    // Restore focus and cursor after the inserted marker.
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + '[BLANK]'.length;
      el.setSelectionRange(pos, pos);
    });
  }

  // Build the preview — split on [BLANK] and interleave highlighted spans.
  const parts = value.split('[BLANK]');
  const hasBlank = parts.length > 1;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-label-md text-text-primary">
          {label}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertBlank}
          className="h-7 gap-1.5 border-action-default px-2.5 text-action-default hover:bg-action-subtle"
        >
          <PlusSquare className="size-3.5" />
          Insert [BLANK]
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className ?? 'min-h-36'}
      />

      {hint && <p className="text-label-sm text-text-muted">{hint}</p>}
      {error && <p className="text-label-sm text-feedback-error">{error}</p>}

      {hasBlank && (
        <div className="rounded-input border border-border-default bg-bg-page px-3 py-2.5">
          <p className="mb-1.5 text-label-sm font-semibold text-text-muted">Preview</p>
          <p className="text-body-sm leading-relaxed text-text-primary">
            {parts.map((segment, i) => (
              <span key={i}>
                {segment}
                {i < parts.length - 1 && (
                  <span className="mx-0.5 inline-flex items-center rounded px-1.5 py-0.5 font-semibold text-action-default bg-action-subtle text-label-sm">
                    BLANK {i + 1}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
