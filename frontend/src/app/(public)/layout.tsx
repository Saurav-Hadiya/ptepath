import type { ReactNode } from 'react';
import LandingNavbar from '@/components/shared/LandingNavbar';
import LandingFooter from '@/components/shared/LandingFooter';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LandingNavbar />
      {children}
      <LandingFooter />
    </>
  );
}
