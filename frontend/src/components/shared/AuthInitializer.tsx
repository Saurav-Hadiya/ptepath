'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthInitializer() {
  const { initAuth } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initAuth();
  }, [initAuth]);

  return null;
}
