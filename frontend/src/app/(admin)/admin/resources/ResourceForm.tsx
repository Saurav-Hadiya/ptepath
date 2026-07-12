'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import FormSection from '@/components/admin/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminResourceCreate, useAdminResourceUpdate } from '@/hooks/queries/useAdminResourceQueries';
import { ROUTES } from '@/config/routes';
import type { AdminResource } from '@/types';

interface ResourceFormProps {
  mode: 'create' | 'edit';
  existingResource?: AdminResource;
}

const ACCEPTED_TYPES: Record<string, number> = {
  'application/pdf': 15,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10,
  'image/jpeg': 5,
  'image/jpg': 5,
  'image/png': 5,
  'image/webp': 5,
};
const ACCEPT_ATTR = '.pdf,.docx,.jpg,.jpeg,.png,.webp';

export default function ResourceForm({ mode, existingResource }: ResourceFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const createMutation = useAdminResourceCreate();
  const updateMutation = useAdminResourceUpdate();

  const [title, setTitle] = useState(existingResource?.title ?? '');
  const [description, setDescription] = useState(existingResource?.description ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateAndSetFile(selected: File) {
    const maxSizeMB = ACCEPTED_TYPES[selected.type];
    if (!maxSizeMB) {
      setErrors((prev) => ({ ...prev, file: 'Only PDF, DOCX, JPG, PNG, or WEBP files are accepted.' }));
      return;
    }
    if (selected.size > maxSizeMB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: `File must be ${maxSizeMB}MB or smaller for this file type.` }));
      return;
    }
    setErrors((prev) => ({ ...prev, file: '' }));
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors: Record<string, string> = {};
    if (!title.trim()) fieldErrors.title = 'Title is required.';
    if (!description.trim()) fieldErrors.description = 'Description is required.';
    if (mode === 'create' && !file) fieldErrors.file = 'Please select a file to upload.';
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (mode === 'edit' && existingResource) {
      await updateMutation.mutateAsync({
        id: existingResource.id,
        input: { title: title.trim(), description: description.trim() },
      });
    } else if (file) {
      await createMutation.mutateAsync({ title: title.trim(), description: description.trim(), file });
    }
    router.push(ROUTES.admin.resources.home);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <main className="pb-24">
      <PageHeader
        title={mode === 'edit' ? 'Edit Resource' : 'Upload Resource'}
        subtitle={
          mode === 'edit'
            ? 'Update the title and description. The file itself cannot be changed.'
            : 'Add a PDF, DOCX, or image file to the shared resource library.'
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormSection title="Resource Details">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            {errors.title && <p className="text-label-sm text-feedback-error">{errors.title}</p>}
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            {errors.description && <p className="text-label-sm text-feedback-error">{errors.description}</p>}
          </div>
        </FormSection>

        {mode === 'create' && (
          <FormSection title="File">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) validateAndSetFile(selected);
              }}
            />
            {file ? (
              <div className="flex items-center justify-between gap-3 rounded-input border border-border-default bg-bg-page px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText className="size-5 shrink-0 text-action-default" />
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-medium text-text-primary">{file.name}</p>
                    <p className="text-label-sm text-text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-feedback-error"
                  onClick={() => {
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                  aria-label="Remove file"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) validateAndSetFile(dropped);
                }}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-input border-2 border-dashed border-border-default px-4 py-8 text-center transition-colors hover:border-action-default"
              >
                <Upload className="size-6 text-text-muted" />
                <p className="text-body-sm text-text-secondary">
                  <span className="text-action-default">Click to upload</span> or drag and drop
                </p>
                <p className="text-label-sm text-text-muted">PDF (max 15MB) · DOCX (max 10MB) · Images (max 5MB)</p>
              </div>
            )}
            {errors.file && <p className="mt-1.5 text-label-sm text-feedback-error">{errors.file}</p>}
          </FormSection>
        )}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t border-border-default bg-bg-page px-4 py-3 sm:mx-0 sm:rounded-card sm:border sm:px-5">
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.admin.resources.home} />}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-1.5">
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Resource'}
          </Button>
        </div>
      </form>
    </main>
  );
}
