import Logo from './Logo';

interface AuthWrapperProps {
  children: React.ReactNode;
  navLabel?: string;
}

export default function AuthWrapper({ children, navLabel = 'Secure Access' }: AuthWrapperProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-primary">
      {/* Decorative gradients */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary via-[#0d1843] to-[#142257]" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-action-default/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-[400px] w-[400px] rounded-full bg-brand-accent/6 blur-3xl" />

      {/* Navbar */}
      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between px-6 sm:px-8">
        <Logo variant="light" size="sm" />
        {navLabel && (
          <span className="text-label-sm uppercase tracking-widest text-white/35">{navLabel}</span>
        )}
      </header>

      {/* Centered content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
