'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import FormSection from '@/components/admin/FormSection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useAdminWritingCreate,
  useAdminWritingUpdate,
  useAdminWritingTypeSettings,
} from '@/hooks/queries/useAdminWritingQueries';
import { adminWritingFormSchema } from '@/lib/validations/admin';
import { ROUTES } from '@/config/routes';
import { getWritingTypeConfig } from './writing-types';
import type { AdminWritingQuestion } from '@/types';

interface WritingQuestionFormProps {
  type: string;
  mode: 'create' | 'edit';
  existingQuestion?: AdminWritingQuestion;
}

interface FormState {
  content: string;
}

export default function WritingQuestionForm({ type, mode, existingQuestion }: WritingQuestionFormProps) {
  const router = useRouter();
  const config = getWritingTypeConfig(type);

  const createMutation = useAdminWritingCreate(type);
  const updateMutation = useAdminWritingUpdate(type);
  const typeSettingsQuery = useAdminWritingTypeSettings(type);

  const [form, setForm] = useState<FormState>(() => ({
    content: existingQuestion?.content ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!config) return null;

  const wordMin = existingQuestion?.wordMin ?? config.wordMin;
  const wordMax = existingQuestion?.wordMax ?? config.wordMax;
  const timeLimitSeconds = existingQuestion?.timeLimit ?? typeSettingsQuery.data?.timeLimit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = adminWritingFormSchema.safeParse({
      type,
      content: form.content,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (mode === 'edit' && existingQuestion) {
      await updateMutation.mutateAsync({
        id: existingQuestion.id,
        input: { content: form.content.trim() },
      });
    } else {
      await createMutation.mutateAsync({ type, content: form.content.trim() });
    }
    router.push(ROUTES.admin.writing.type(type));
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <main className="pb-24">
      <PageHeader
        title={mode === 'edit' ? `Edit ${config.label} Question` : `Add ${config.label} Question`}
        subtitle={config.description}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormSection title="Question Content">
          <div className="flex flex-col gap-1.5">
            <Label>{config.contentLabel}</Label>
            <Textarea
              rows={8}
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            />
            {errors.content && <p className="text-label-sm text-feedback-error">{errors.content}</p>}
          </div>
        </FormSection>

        <FormSection title="Timing & Response Limits">
          <div className="flex flex-col gap-1.5">
            <Label>Time Limit</Label>
            <p className="text-label-sm text-text-muted">
              {timeLimitSeconds
                ? `${Math.round(timeLimitSeconds / 60)} minutes for every question of this type.`
                : 'Loading current setting...'}{' '}
              Managed at the question type level — go back to the question list and use the &quot;Type-wide
              Settings&quot; card to change it.
            </p>
          </div>

          <p className="mt-3 rounded-input border border-border-default bg-bg-page px-3 py-2.5 text-label-sm text-text-muted">
            Student responses must be between {wordMin}-{wordMax} words — automatically enforced by the system.
            This range is fixed per question type and cannot be edited here.
          </p>
        </FormSection>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t border-border-default bg-bg-page px-4 py-3 sm:mx-0 sm:rounded-card sm:border sm:px-5">
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.admin.writing.type(type)} />}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-1.5">
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Question'}
          </Button>
        </div>
      </form>
    </main>
  );
}
