'use client';

import { AlertTriangle, Download, FileImage, FileText, File as FileIcon, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { useResourceList } from '@/hooks/queries/useResourceQueries';
import type { ResourceFileType } from '@/types';

const FILE_TYPE_ICON: Record<ResourceFileType, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  image: FileImage,
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourcesContent() {
  const { data: resources, isLoading, isError, refetch } = useResourceList();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Resources" subtitle="Helpful study materials shared by your instructor." />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Resources" subtitle="Helpful study materials shared by your instructor." />
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            icon={AlertTriangle}
            title="Could not load resources"
            description="Please refresh the page to try again."
            action={<Button onClick={() => refetch()}>Refresh</Button>}
          />
        </div>
      </div>
    );
  }

  const list = resources ?? [];

  return (
    <div>
      <PageHeader title="Resources" subtitle="Helpful study materials shared by your instructor." />

      {list.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No resources available"
          description="Your instructor has not shared any resources yet."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((resource) => {
            const Icon = FILE_TYPE_ICON[resource.fileType] ?? FileIcon;
            return (
              <div
                key={resource.id}
                className="flex flex-col gap-3 rounded-card border border-border-default bg-bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-hover sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action-subtle text-action-default">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-body-sm font-semibold text-text-primary">{resource.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-body-sm text-text-secondary">{resource.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-label-sm uppercase">
                        {resource.fileType}
                      </Badge>
                      <Badge variant="outline" className="text-label-sm">
                        {formatSize(resource.fileSize)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  nativeButton={false}
                  render={<a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" />}
                  variant="outline"
                  className="shrink-0 gap-1.5 sm:self-center"
                >
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
