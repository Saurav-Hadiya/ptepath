import { Suspense } from 'react';
import ResourcesContent from './ResourcesContent';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminResourcesPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage size="lg" label="Loading resources..." />}>
      <ResourcesContent />
    </Suspense>
  );
}
