'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import FormSection from '@/components/admin/FormSection';
import ImageUpload from '@/components/admin/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useAdminSpeakingCreate,
  useAdminSpeakingUpdate,
} from '@/hooks/queries/useAdminSpeakingQueries';
import { adminSpeakingFormSchema } from '@/lib/validations/admin';
import { ROUTES } from '@/config/routes';
import { getSpeakingTypeConfig, SPEAKING_TIME_BOUNDS, PREPARATION_TIME_BOUNDS } from './speaking-types';
import type { AdminSpeakingQuestion } from '@/types';

interface SpeakingQuestionFormProps {
  type: string;
  mode: 'create' | 'edit';
  existingQuestion?: AdminSpeakingQuestion;
}

interface FormState {
  content: string;
  speakingTime: number;
  preparationTime: number;
  acceptedAnswers: string[];
  imageFile: File | null;
  existingImageUrl: string | null;
}

export default function SpeakingQuestionForm({ type, mode, existingQuestion }: SpeakingQuestionFormProps) {
  const router = useRouter();
  const config = getSpeakingTypeConfig(type);

  const createMutation = useAdminSpeakingCreate(type);
  const updateMutation = useAdminSpeakingUpdate(type);

  const [form, setForm] = useState<FormState>(() => ({
    content: existingQuestion?.content ?? '',
    speakingTime: existingQuestion?.speakingTime ?? config?.defaultSpeakingTime ?? 30,
    preparationTime: existingQuestion?.preparationTime ?? config?.defaultPreparationTime ?? 0,
    acceptedAnswers: existingQuestion?.acceptedAnswers?.length ? existingQuestion.acceptedAnswers : [''],
    imageFile: null,
    existingImageUrl: existingQuestion?.imageUrl ?? null,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!config) return null;

  function handleAnswerChange(index: number, value: string) {
    setForm((prev) => {
      const acceptedAnswers = [...prev.acceptedAnswers];
      acceptedAnswers[index] = value;
      return { ...prev, acceptedAnswers };
    });
  }

  function addAnswerField() {
    setForm((prev) => ({ ...prev, acceptedAnswers: [...prev.acceptedAnswers, ''] }));
  }

  function removeAnswerField(index: number) {
    setForm((prev) => ({
      ...prev,
      acceptedAnswers: prev.acceptedAnswers.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = adminSpeakingFormSchema.safeParse({
      type,
      content: form.content,
      speakingTime: form.speakingTime,
      preparationTime: form.preparationTime,
      acceptedAnswers: form.acceptedAnswers,
      imageFile: form.imageFile,
      existingImageUrl: form.existingImageUrl,
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

    const acceptedAnswers =
      type === 'answer_short'
        ? form.acceptedAnswers.map((a) => a.trim()).filter((a) => a.length > 0)
        : undefined;

    const input = {
      type,
      content: type === 'describe_image' ? undefined : form.content.trim(),
      speakingTime: form.speakingTime,
      preparationTime: form.preparationTime,
      acceptedAnswers,
      imageFile: form.imageFile,
    };

    if (mode === 'edit' && existingQuestion) {
      await updateMutation.mutateAsync({ id: existingQuestion.id, input });
    } else {
      await createMutation.mutateAsync(input);
    }
    router.push(ROUTES.admin.speaking.type(type));
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
          {type === 'describe_image' ? (
            <div className="flex flex-col gap-1.5">
              <Label>{config.contentLabel}</Label>
              <ImageUpload
                onFileSelected={(file) => setForm((prev) => ({ ...prev, imageFile: file }))}
                existingImageUrl={form.existingImageUrl}
              />
              {errors.imageFile && <p className="text-label-sm text-feedback-error">{errors.imageFile}</p>}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label>{config.contentLabel}</Label>
              {type === 'answer_short' ? (
                <Input
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                />
              ) : (
                <Textarea
                  rows={6}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                />
              )}
              {config.hint && <p className="text-label-sm text-text-muted">{config.hint}</p>}
              {errors.content && <p className="text-label-sm text-feedback-error">{errors.content}</p>}
            </div>
          )}
        </FormSection>

        <FormSection title="Timing">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Speaking Time (seconds)</Label>
              <Input
                type="number"
                min={SPEAKING_TIME_BOUNDS.min}
                max={SPEAKING_TIME_BOUNDS.max}
                value={form.speakingTime}
                onChange={(e) => setForm((prev) => ({ ...prev, speakingTime: Number(e.target.value) }))}
              />
              <p className="text-label-sm text-text-muted">
                Between {SPEAKING_TIME_BOUNDS.min} and {SPEAKING_TIME_BOUNDS.max} seconds.
              </p>
              {errors.speakingTime && <p className="text-label-sm text-feedback-error">{errors.speakingTime}</p>}
            </div>
            {config.hasPreparationTime && (
              <div className="flex flex-col gap-1.5">
                <Label>Preparation Time (seconds)</Label>
                <Input
                  type="number"
                  min={PREPARATION_TIME_BOUNDS.min}
                  max={PREPARATION_TIME_BOUNDS.max}
                  value={form.preparationTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, preparationTime: Number(e.target.value) }))}
                />
                <p className="text-label-sm text-text-muted">
                  Between {PREPARATION_TIME_BOUNDS.min} and {PREPARATION_TIME_BOUNDS.max} seconds.
                </p>
                {errors.preparationTime && (
                  <p className="text-label-sm text-feedback-error">{errors.preparationTime}</p>
                )}
              </div>
            )}
          </div>
        </FormSection>

        {type === 'answer_short' && (
          <FormSection title="Accepted Answers">
            <div className="flex flex-col gap-2">
              {form.acceptedAnswers.map((answer, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={answer} onChange={(e) => handleAnswerChange(index, e.target.value)} />
                  {form.acceptedAnswers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-feedback-error"
                      onClick={() => removeAnswerField(index)}
                      aria-label="Remove answer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addAnswerField} className="w-fit gap-1.5">
                <Plus className="size-3.5" />
                Add another answer
              </Button>
              {errors.acceptedAnswers && (
                <p className="text-label-sm text-feedback-error">{errors.acceptedAnswers}</p>
              )}
            </div>
          </FormSection>
        )}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t border-border-default bg-bg-page px-4 py-3 sm:mx-0 sm:rounded-card sm:border sm:px-5">
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.admin.speaking.type(type)} />}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Question'}
          </Button>
        </div>
      </form>
    </main>
  );
}
