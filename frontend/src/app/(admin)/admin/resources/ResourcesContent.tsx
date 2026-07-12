'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, FileImage, File as FileIcon, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import StatusToggle from '@/components/admin/StatusToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useAdminResourceList,
  useAdminResourceDelete,
  useAdminResourceToggleStatus,
} from '@/hooks/queries/useAdminResourceQueries';
import { ROUTES } from '@/config/routes';
import type { AdminResource, ResourceFileType } from '@/types';

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
  const { data: resources, isLoading } = useAdminResourceList();
  const deleteMutation = useAdminResourceDelete();
  const toggleStatusMutation = useAdminResourceToggleStatus();

  const [deleteTarget, setDeleteTarget] = useState<AdminResource | null>(null);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  const list = resources ?? [];

  function handleToggleStatus(resource: AdminResource, nextValue: boolean) {
    setToggleLoadingId(resource.id);
    toggleStatusMutation.mutate(
      { id: resource.id, isActive: nextValue },
      { onSettled: () => setToggleLoadingId(null) }
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  return (
    <div>
      <PageHeader
        title="Resources"
        subtitle={isLoading ? undefined : `${list.length} resource${list.length === 1 ? '' : 's'}`}
        actions={
          <Button nativeButton={false} render={<Link href={ROUTES.admin.resources.new} />} className="gap-1.5">
            <Plus className="size-4" />
            Upload Resource
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-card" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No resources yet"
          description="Upload your first resource to make it available to students."
          action={
            <Button nativeButton={false} render={<Link href={ROUTES.admin.resources.new} />} className="gap-1.5">
              <Plus className="size-4" />
              Upload Resource
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((resource) => {
            const Icon = FILE_TYPE_ICON[resource.fileType] ?? FileIcon;
            return (
              <div
                key={resource.id}
                className="flex flex-col gap-3 rounded-card border border-border-default bg-bg-card p-4 shadow-card sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-action-subtle text-action-default">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-body-sm font-semibold text-text-primary">
                        {resource.title}
                      </div>
                      <div className="truncate text-label-sm text-text-secondary">{resource.description}</div>
                    </div>
                  </div>
                  <StatusToggle
                    isActive={resource.isActive}
                    isLoading={toggleLoadingId === resource.id}
                    onToggle={(next) => handleToggleStatus(resource, next)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-label-sm uppercase">
                    {resource.fileType}
                  </Badge>
                  <Badge variant="outline" className="text-label-sm">
                    {formatSize(resource.fileSize)}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border-default pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={ROUTES.admin.resources.edit(resource.id)} />}
                    className="gap-1.5"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-feedback-error hover:bg-feedback-error-bg"
                    onClick={() => setDeleteTarget(resource)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete this resource?"
        description="Students will no longer be able to access this file. This cannot be undone."
        confirmLabel="Delete"
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
