'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import FormSection from '@/components/admin/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateStudent } from '@/hooks/queries/useAdminStudentQueries';
import { createStudentSchema } from '@/lib/validations/admin';
import { ROUTES } from '@/config/routes';

function flattenErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const errs: Record<string, string> = {};
  for (const [field, msgs] of Object.entries(error.flatten().fieldErrors)) {
    errs[field] = msgs?.[0] ?? '';
  }
  return errs;
}

export default function NewStudentContent() {
  const router = useRouter();
  const createMutation = useCreateStudent();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = createStudentSchema.safeParse({ name, email, temporaryPassword });
    if (!result.success) {
      setFieldErrors(flattenErrors(result.error));
      return;
    }

    createMutation.mutate(result.data, {
      onSuccess: () => router.push(ROUTES.admin.students.home),
    });
  }

  return (
    <main className="pb-24">
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.admin.students.home} />}
          className="gap-1.5 text-text-secondary"
        >
          <ArrowLeft className="size-3.5" />
          Back to Students
        </Button>
      </div>

      <PageHeader
        title="Add Student"
        subtitle="Create a new student account. They will be required to change their password on first login."
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="Student Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="student-name">Full Name</Label>
              <Input
                id="student-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="off"
              />
              {fieldErrors.name && (
                <p className="text-label-sm text-feedback-error">{fieldErrors.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="student-email">Email Address</Label>
              <Input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                autoComplete="off"
              />
              {fieldErrors.email && (
                <p className="text-label-sm text-feedback-error">{fieldErrors.email}</p>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="Initial Password">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-temp-password">Temporary Password</Label>
            <Input
              id="student-temp-password"
              type="text"
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
              placeholder="At least 8 characters and 1 number"
              autoComplete="new-password"
              className="max-w-sm"
            />
            <p className="text-label-sm text-text-muted">
              The student will be required to change this password on their first login.
            </p>
            {fieldErrors.temporaryPassword && (
              <p className="text-label-sm text-feedback-error">{fieldErrors.temporaryPassword}</p>
            )}
          </div>
        </FormSection>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t border-border-default bg-bg-page px-4 py-3 sm:mx-0 sm:rounded-card sm:border sm:px-5">
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.admin.students.home} />}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending} className="gap-1.5">
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {createMutation.isPending ? 'Creating...' : 'Create Student'}
          </Button>
        </div>
      </form>
    </main>
  );
}
