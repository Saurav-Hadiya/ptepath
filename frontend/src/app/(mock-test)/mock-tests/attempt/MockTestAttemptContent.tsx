'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MockTestRunner from '@/components/mock-test/MockTestRunner';
import { consumeMockStart } from '@/lib/mock-test-session';
import { ROUTES } from '@/config/routes';
import type { MockTestStartData } from '@/types';

export default function MockTestAttemptContent() {
  const router = useRouter();

  // Read (and clear) the pending start payload exactly once. A `useState`
  // lazy initializer would work most of the time, but React 18 Strict Mode
  // deliberately invokes it twice in development to surface impure
  // initializers — and this one has a real side effect (clearing
  // sessionStorage), so the second invocation would read back nothing. The
  // ref persists across both invocations of the same render pass, so this
  // guard runs the side-effecting read exactly once regardless.
  const startDataRef = useRef<MockTestStartData | null | undefined>(undefined);
  if (startDataRef.current === undefined) {
    startDataRef.current = consumeMockStart();
  }
  const startData = startDataRef.current;

  useEffect(() => {
    if (!startData) router.replace(ROUTES.student.mockTests.home);
  }, [startData, router]);

  if (!startData) return null;

  return <MockTestRunner startData={startData} />;
}
