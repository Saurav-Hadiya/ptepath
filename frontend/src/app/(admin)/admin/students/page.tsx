import { Suspense } from 'react';
import StudentsContent from './StudentsContent';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminStudentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage size="lg" label="Loading students..." />}>
      <StudentsContent />
    </Suspense>
  );
}
