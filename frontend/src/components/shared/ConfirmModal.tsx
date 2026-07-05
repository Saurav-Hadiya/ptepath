'use client';

import { Trash2, TriangleAlert, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  isDanger = false,
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <span
          className={`mb-1 flex size-12 items-center justify-center rounded-full ${
            isDanger ? 'bg-feedback-error-bg' : 'bg-action-subtle'
          }`}
        >
          {isDanger ? (
            <Trash2 className="size-5 text-feedback-error" />
          ) : (
            <TriangleAlert className="size-5 text-action-default" />
          )}
        </span>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-display-sm text-brand-primary">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-body-sm text-text-secondary">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isDanger && (
          <div className="flex items-start gap-2 rounded-input border border-feedback-error/20 bg-feedback-error-bg px-3 py-2.5 text-body-sm text-feedback-error-text">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            This action cannot be undone.
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={`gap-1.5 ${
              isDanger
                ? 'bg-feedback-error text-primary-foreground hover:bg-feedback-error/90'
                : 'bg-action-default text-primary-foreground hover:bg-action-hover'
            }`}
          >
            {isLoading && <Loader2 className="size-3.5 animate-spin" />}
            {isLoading ? 'Please wait...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
