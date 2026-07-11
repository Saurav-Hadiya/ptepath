'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import FormSection from '@/components/admin/FormSection';
import BlankableTextarea from '@/components/admin/BlankableTextarea';
import OptionsListEditor from '@/components/admin/OptionsListEditor';
import ParagraphsEditor from './ParagraphsEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useAdminReadingDetail,
  useAdminReadingCreate,
  useAdminReadingUpdate,
} from '@/hooks/queries/useAdminReadingQueries';
import {
  emptyReadingForm,
  toReadingFormState,
  detectBlankCount,
  validateReadingForm,
  buildReadingPayload,
  type ReadingFormState,
} from './reading-validation';
import { getReadingTypeConfig } from './reading-types';
import { ROUTES } from '@/config/routes';
import type { ReadingQuestionType } from '@/types';

interface ReadingQuestionFormProps {
  mode: 'create' | 'edit';
  type: ReadingQuestionType;
  questionId?: string;
}

export default function ReadingQuestionForm({ mode, type, questionId }: ReadingQuestionFormProps) {
  const router = useRouter();
  const config = getReadingTypeConfig(type);
  const detailQuery = useAdminReadingDetail(mode === 'edit' ? (questionId ?? '') : '');
  const createMutation = useAdminReadingCreate(type);
  const updateMutation = useAdminReadingUpdate(type);

  const [form, setForm] = useState<ReadingFormState>(() => emptyReadingForm(type));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(mode === 'create');

  useEffect(() => {
    if (mode === 'edit' && detailQuery.data && !hydrated) {
      setForm(toReadingFormState(detailQuery.data));
      setHydrated(true);
    }
  }, [mode, detailQuery.data, hydrated]);

  // Keep the per-blank answer arrays in sync with the [BLANK] markers typed in the passage.
  useEffect(() => {
    if (form.type === 'rw_fill_blanks') {
      const count = detectBlankCount(form.passage);
      if (form.blankAnswers.length !== count) {
        setForm((prev) => ({
          ...prev,
          blankAnswers: Array.from({ length: count }, (_, i) => prev.blankAnswers[i] ?? ''),
        }));
      }
    }
    if (form.type === 'reading_fill_blanks') {
      const count = detectBlankCount(form.passage);
      if (form.readingBlanks.length !== count) {
        setForm((prev) => ({
          ...prev,
          readingBlanks: Array.from(
            { length: count },
            (_, i) => prev.readingBlanks[i] ?? { correctAnswer: '', wrongOptions: ['', ''] }
          ),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.passage, form.type]);

  const backHref = ROUTES.admin.reading.type(type);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateReadingForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = buildReadingPayload(form);
    if (mode === 'create') {
      createMutation.mutate(payload, { onSuccess: () => router.push(backHref) });
    } else if (questionId) {
      updateMutation.mutate({ id: questionId, input: payload }, { onSuccess: () => router.push(backHref) });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (mode === 'edit' && !hydrated) {
    return <LoadingSpinner label="Loading question..." fullPage />;
  }

  return (
    <main className="pb-20">
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center gap-1.5 text-label-sm text-text-secondary hover:text-action-default"
      >
        <ArrowLeft className="size-3.5" />
        Back to {config?.label ?? type}
      </Link>

      <PageHeader
        title={mode === 'create' ? `Add ${config?.label ?? 'Question'}` : `Edit ${config?.label ?? 'Question'}`}
        subtitle={config?.description}
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormSection title="Reading Passage">
          {(form.type === 'rw_fill_blanks' || form.type === 'reading_fill_blanks') ? (
            <BlankableTextarea
              id="reading-passage"
              label="Reading Passage"
              value={form.passage}
              onChange={(v) => setForm((prev) => ({ ...prev, passage: v }))}
              placeholder="Enter the passage — click Insert [BLANK] to add blanks"
              className="min-h-40"
              hint="Each [BLANK] marker becomes a fill-in-the-blank question for the student."
              error={fieldErrors.passage}
            />
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="reading-passage" className="text-label-md text-text-primary">
                Reading Passage
              </Label>
              <Textarea
                id="reading-passage"
                value={form.passage}
                onChange={(e) => setForm((prev) => ({ ...prev, passage: e.target.value }))}
                placeholder="Enter the passage text students will read"
                className="min-h-40"
              />
              {fieldErrors.passage && <p className="text-label-sm text-feedback-error">{fieldErrors.passage}</p>}
            </div>
          )}
        </FormSection>

        {form.type === 'rw_fill_blanks' && (
          <FormSection title="Word Bank">
            <div className="space-y-1.5">
              <Label className="text-label-md text-text-primary">Word Options</Label>
              <p className="text-label-sm text-text-muted">
                All the words students can choose from to fill in the blanks.
              </p>
              <div className="space-y-2">
                {form.wordPool.map((word, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={word}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          wordPool: prev.wordPool.map((w, i) => (i === index ? e.target.value : w)),
                        }))
                      }
                      placeholder="Word"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-feedback-error hover:bg-feedback-error-bg"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          wordPool: prev.wordPool.filter((_, i) => i !== index),
                        }))
                      }
                      aria-label="Remove word"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setForm((prev) => ({ ...prev, wordPool: [...prev.wordPool, ''] }))}
              >
                <Plus className="size-3.5" />
                Add word
              </Button>
              {fieldErrors.wordPool && <p className="text-label-sm text-feedback-error">{fieldErrors.wordPool}</p>}
            </div>

            {form.blankAnswers.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <Label className="text-label-md text-text-primary">Correct Answer for Each Blank</Label>
                <div className="space-y-2">
                  {form.blankAnswers.map((answer, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-label-sm text-text-secondary">Blank {index + 1}</span>
                      <Select
                        value={answer || undefined}
                        onValueChange={(v) =>
                          setForm((prev) => ({
                            ...prev,
                            blankAnswers: prev.blankAnswers.map((a, i) => (i === index ? (v ?? '') : a)),
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select the correct word" />
                        </SelectTrigger>
                        <SelectContent>
                          {form.wordPool
                            .map((w) => w.trim())
                            .filter(Boolean)
                            .map((word, i) => (
                              <SelectItem key={`${word}-${i}`} value={word}>
                                {word}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                {fieldErrors.blanks && <p className="text-label-sm text-feedback-error">{fieldErrors.blanks}</p>}
              </div>
            )}
          </FormSection>
        )}

        {form.type === 'reading_fill_blanks' && form.readingBlanks.length > 0 && (
          <FormSection title="Blanks">
            <div className="space-y-3">
              {form.readingBlanks.map((blank, index) => (
                <div key={index} className="space-y-2 rounded-input border border-border-default p-3">
                  <p className="text-label-sm text-text-secondary">Blank {index + 1}</p>
                  <div className="space-y-1">
                    <Label className="text-label-sm text-text-primary">Correct Answer for This Blank</Label>
                    <Input
                      value={blank.correctAnswer}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          readingBlanks: prev.readingBlanks.map((b, i) =>
                            i === index ? { ...b, correctAnswer: e.target.value } : b
                          ),
                        }))
                      }
                      placeholder="Correct answer"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-label-sm text-text-primary">Wrong Options (shown alongside the correct answer)</Label>
                    {blank.wrongOptions.map((wrong, wIndex) => (
                      <div key={wIndex} className="flex items-center gap-2">
                        <Input
                          value={wrong}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              readingBlanks: prev.readingBlanks.map((b, i) =>
                                i === index
                                  ? { ...b, wrongOptions: b.wrongOptions.map((w, wi) => (wi === wIndex ? e.target.value : w)) }
                                  : b
                              ),
                            }))
                          }
                          placeholder={`Wrong option ${wIndex + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-feedback-error hover:bg-feedback-error-bg"
                          disabled={blank.wrongOptions.length <= 1}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              readingBlanks: prev.readingBlanks.map((b, i) =>
                                i === index ? { ...b, wrongOptions: b.wrongOptions.filter((_, wi) => wi !== wIndex) } : b
                              ),
                            }))
                          }
                          aria-label="Remove wrong option"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          readingBlanks: prev.readingBlanks.map((b, i) =>
                            i === index ? { ...b, wrongOptions: [...b.wrongOptions, ''] } : b
                          ),
                        }))
                      }
                    >
                      <Plus className="size-3.5" />
                      Add wrong option
                    </Button>
                  </div>
                </div>
              ))}
              {fieldErrors.blanks && <p className="text-label-sm text-feedback-error">{fieldErrors.blanks}</p>}
            </div>
          </FormSection>
        )}

        {(form.type === 'mcq_multiple' || form.type === 'mcq_single') && (
          <FormSection title="Question">
            <div className="space-y-1.5">
              <Label htmlFor="reading-question" className="text-label-md text-text-primary">
                Question Text
              </Label>
              <Input
                id="reading-question"
                value={form.question}
                onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                placeholder="Enter the question shown above the options"
              />
              {fieldErrors.question && <p className="text-label-sm text-feedback-error">{fieldErrors.question}</p>}
            </div>
            <div className="mt-4 space-y-1.5">
              <Label className="text-label-md text-text-primary">Answer Options</Label>
              <p className="text-label-sm text-text-muted">
                {form.type === 'mcq_multiple'
                  ? 'Check every option that is a correct answer.'
                  : 'Select the one option that is the correct answer.'}
              </p>
              <OptionsListEditor
                options={form.options}
                onChange={(options) => setForm((prev) => ({ ...prev, options }))}
                mode={form.type === 'mcq_multiple' ? 'multiple' : 'single'}
                error={fieldErrors.options}
              />
            </div>
          </FormSection>
        )}

        {form.type === 'reorder_paragraphs' && (
          <FormSection title="Paragraphs in Correct Order">
            <p className="mb-2 text-label-sm text-text-muted">
              Enter the paragraphs in their correct order — students will see them shuffled.
            </p>
            <ParagraphsEditor
              paragraphs={form.paragraphs}
              onChange={(paragraphs) => setForm((prev) => ({ ...prev, paragraphs }))}
              error={fieldErrors.paragraphs}
            />
          </FormSection>
        )}

        <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border-default bg-bg-page/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(backHref)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-action-default text-primary-foreground hover:bg-action-hover">
            {isSaving ? 'Saving...' : mode === 'create' ? 'Add Question' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </main>
  );
}
