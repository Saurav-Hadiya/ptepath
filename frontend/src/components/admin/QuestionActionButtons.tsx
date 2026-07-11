'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuestionActionButtonsProps {
  editHref: string;
  onDelete: () => void;
  deleteDisabled?: boolean;
}

/** Edit/Delete row — labels always visible (no icon-only buttons, no hover-only tooltips). */
export default function QuestionActionButtons({
  editHref,
  onDelete,
  deleteDisabled,
}: QuestionActionButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href={editHref} />}
        className="gap-1.5"
      >
        <Pencil className="size-3.5" />
        Edit
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-feedback-error hover:bg-feedback-error-bg"
        onClick={onDelete}
        disabled={deleteDisabled}
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>
    </div>
  );
}
