'use client';

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAdminResourceDetail } from '@/hooks/queries/useAdminResourceQueries';
import { ROUTES } from '@/config/routes';
import ResourceForm from '../../ResourceForm';

export default function EditResourceContent({ id }: { id: string }) {
  const { data: resource, isLoading, isError } = useAdminResourceDetail(id);

  if (isLoading) {
    return (
      <main className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/3 rounded-input" />
        <Skeleton className="h-64 rounded-card" />
      </main>
    );
  }

  if (isError || !resource) {
    return (
      <main>
        <EmptyState
          icon={FileQuestion}
          title="Resource not found"
          description="This resource may have been deleted or the link is invalid."
          action={
            <Button nativeButton={false} render={<Link href={ROUTES.admin.resources.home} />}>
              Back to list
            </Button>
          }
        />
      </main>
    );
  }

  return <ResourceForm mode="edit" existingResource={resource} />;
}
