'use client';

import { useAuthSession } from '@/hooks/useAuth';

export default function AuthInitializer() {
  useAuthSession();
  return null;
}
