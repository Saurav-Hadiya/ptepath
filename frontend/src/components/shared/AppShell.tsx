'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface NavDrawerCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<NavDrawerCtx | null>(null);

export function useNavDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNavDrawer must be used within AppShell');
  return ctx;
}

interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}

export default function AppShell({ sidebar, topbar, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <Ctx.Provider value={{ open, setOpen, toggle }}>
      <div className="flex h-[100dvh] w-full overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">{sidebar}</div>

        {/* Mobile drawer */}
        <div
          className={`fixed inset-0 z-40 lg:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
          aria-hidden={!open}
        >
          <div
            className={`absolute inset-0 bg-brand-primary/60 backdrop-blur-sm transition-opacity duration-200 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute inset-y-0 left-0 flex max-w-[85vw] transform transition-transform duration-200 ease-out ${
              open ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {sidebar}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {topbar}
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-bg-page p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </Ctx.Provider>
  );
}
