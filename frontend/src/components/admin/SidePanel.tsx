'use client';

import type { ReactNode } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export default function SidePanel({ isOpen, onClose, title, children, width = '480px' }: SidePanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-full sm:max-w-(--panel-width)"
        style={{ '--panel-width': width } as React.CSSProperties}
      >
        <SheetHeader className="border-b border-border-default px-5 py-4">
          <SheetTitle className="font-display text-display-sm text-brand-primary">{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
