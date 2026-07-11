import { Suspense } from 'react';
import MockTestsContent from './MockTestsContent';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminMockTestsPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage size="lg" label="Loading mock test templates..." />}>
      <MockTestsContent />
    </Suspense>
  );
}
