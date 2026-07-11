'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import FormSection from '@/components/admin/FormSection';
import AudioUpload from '@/components/admin/AudioUpload';
import BlankableTextarea from '@/components/admin/BlankableTextarea';
import OptionsListEditor from '@/components/admin/OptionsListEditor';
import TranscriptWordPicker from './TranscriptWordPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminListeningDetail,
  useAdminListeningCreate,
  useAdminListeningUpdate,
} from '@/hooks/queries/useAdminListeningQueries';
import {
  emptyListeningForm,
  toListeningFormState,
  detectBlankCount,
  validateListeningForm,
  buildListeningPayload,
  type ListeningFormState,
} from './listening-validation';
import { getListeningTypeConfig } from './listening-types';
import { ROUTES } from '@/config/routes';
import type { ListeningQuestionType } from '@/types';

/** Mirrors backend/src/validators/listening.validators.ts timeLimitOptional bounds exactly. */
const TIME_LIMIT_SECONDS = { min: 60, max: 1800 };

interface ListeningQuestionFormProps {
  mode: 'create' | 'edit';
  type: ListeningQuestionType;
  questionId?: string;
}

export default function ListeningQuestionForm({ mode, type, questionId }: ListeningQuestionFormProps) {
  const router = useRouter();
  const config = getListeningTypeConfig(type);
  const detailQuery = useAdminListeningDetail(mode === 'edit' ? (questionId ?? '') : '');
  const createMutation = useAdminListeningCreate(type);
  const updateMutation = useAdminListeningUpdate(type);

  const [form, setForm] = useState<ListeningFormState>(() => emptyListeningForm(type));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(mode === 'create');

  useEffect(() => {
    if (mode === 'edit' && detailQuery.data && !hydrated) {
      setForm(toListeningFormState(detailQuery.data));
      setHydrated(true);
    }
  }, [mode, detailQuery.data, hydrated]);

  // Keep the fill_blanks correct-word array in sync with [BLANK] markers typed in the transcript.
  useEffect(() => {
    if (form.type === 'fill_blanks') {
      const count = detectBlankCount(form.transcript);
      if (form.blankAnswers.length !== count) {
        setForm((prev) => ({
          ...prev,
          blankAnswers: Array.from({ length: count }, (_, i) => prev.blankAnswers[i] ?? ''),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.transcript, form.type]);

  const backHref = ROUTES.admin.listening.type(type);
  const showQuestion = form.type === 'mcq_multiple' || form.type === 'mcq_single';
  const showOptions = ['mcq_multiple', 'mcq_single', 'highlight_summary', 'select_missing'].includes(form.type);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateListeningForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = buildListeningPayload(form);
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
        <FormSection title="Audio">
          <div className="space-y-1.5">
            <Label className="text-label-md text-text-primary">Audio Recording</Label>
            <p className="text-label-sm text-text-muted">Upload the audio clip students will hear.</p>
            <AudioUpload
              onFileSelected={(file) => setForm((prev) => ({ ...prev, audioFile: file }))}
              existingAudioUrl={form.existingAudioUrl}
            />
            {fieldErrors.audio && <p className="text-label-sm text-feedback-error">{fieldErrors.audio}</p>}
          </div>

          <div className="mt-4 rounded-lg border border-border-default bg-bg-accent p-3">
            <p className="text-label-sm text-text-secondary">
              <strong>Play limit</strong> is managed at the question type level. Go back to the question list and
              use the &quot;Type-wide Audio Play Limit&quot; card to change it for all questions of this type.
            </p>
          </div>

          {form.type === 'summarise_spoken' && (
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="listening-time-limit" className="text-label-md text-text-primary">
                Response Time Limit (minutes)
              </Label>
              <p className="text-label-sm text-text-muted">
                How long students get to write their summary — between {TIME_LIMIT_SECONDS.min / 60} and{' '}
                {TIME_LIMIT_SECONDS.max / 60} minutes.
              </p>
              <Input
                id="listening-time-limit"
                type="number"
                min={TIME_LIMIT_SECONDS.min / 60}
                max={TIME_LIMIT_SECONDS.max / 60}
                value={form.timeLimitMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, timeLimitMinutes: Number(e.target.value) }))}
              />
            </div>
          )}
        </FormSection>

        {form.type === 'select_missing' && (
          <FormSection title="Note">
            <p className="text-label-sm text-text-muted">
              Upload audio that cuts off before the final word — students select the missing word from the
              options below.
            </p>
          </FormSection>
        )}

        {showQuestion && (
          <FormSection title="Question">
            <div className="space-y-1.5">
              <Label htmlFor="listening-question" className="text-label-md text-text-primary">
                Question Text
              </Label>
              <Input
                id="listening-question"
                value={form.question}
                onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                placeholder="Enter the question shown above the options"
              />
              {fieldErrors.question && <p className="text-label-sm text-feedback-error">{fieldErrors.question}</p>}
            </div>
          </FormSection>
        )}

        {showOptions && (
          <FormSection title="Answer Options">
            <p className="mb-2 text-label-sm text-text-muted">
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
          </FormSection>
        )}

        {form.type === 'fill_blanks' && (
          <FormSection title="Transcript & Blanks">
            <BlankableTextarea
              id="listening-transcript"
              label="Transcript"
              value={form.transcript}
              onChange={(v) => setForm((prev) => ({ ...prev, transcript: v }))}
              placeholder="Type the transcript — click Insert [BLANK] to mark each missing word"
              className="min-h-32"
              hint="Minor typos in the student's answer are still accepted (fuzzy matching)."
              error={fieldErrors.transcript}
            />
            {form.blankAnswers.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-label-md text-text-primary">Correct Word for Each Blank</Label>
                {form.blankAnswers.map((answer, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-label-sm text-text-secondary">Blank {index + 1}</span>
                    <Input
                      value={answer}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          blankAnswers: prev.blankAnswers.map((a, i) => (i === index ? e.target.value : a)),
                        }))
                      }
                      placeholder="Correct word"
                      className="flex-1"
                    />
                  </div>
                ))}
                {fieldErrors.blanks && <p className="text-label-sm text-feedback-error">{fieldErrors.blanks}</p>}
              </div>
            )}
          </FormSection>
        )}

        {form.type === 'highlight_incorrect' && (
          <FormSection title="Transcript">
            <div className="space-y-1.5">
              <Label htmlFor="listening-transcript-hi" className="text-label-md text-text-primary">
                Transcript
              </Label>
              <Textarea
                id="listening-transcript-hi"
                value={form.transcript}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, transcript: e.target.value, incorrectWordIndices: [] }))
                }
                placeholder="Enter the full transcript of the audio"
                className="min-h-32"
              />
              {fieldErrors.transcript && <p className="text-label-sm text-feedback-error">{fieldErrors.transcript}</p>}
            </div>
            {form.transcript.trim() && (
              <div className="mt-4 space-y-1.5">
                <Label className="text-label-md text-text-primary">Words That Differ From the Audio</Label>
                <p className="text-label-sm text-text-muted">
                  Click every word below that is different from what the audio actually says.
                </p>
                <TranscriptWordPicker
                  transcript={form.transcript}
                  selectedIndices={form.incorrectWordIndices}
                  onChange={(indices) => setForm((prev) => ({ ...prev, incorrectWordIndices: indices }))}
                />
                {fieldErrors.incorrectWordIndices && (
                  <p className="text-label-sm text-feedback-error">{fieldErrors.incorrectWordIndices}</p>
                )}
              </div>
            )}
          </FormSection>
        )}

        {form.type === 'write_dictation' && (
          <FormSection title="Dictation Sentence">
            <div className="space-y-1.5">
              <Label htmlFor="listening-correct-sentence" className="text-label-md text-text-primary">
                Correct Sentence (What the Audio Says)
              </Label>
              <p className="text-label-sm text-text-muted">
                The exact sentence spoken in the audio — used to score the student&apos;s typed answer.
              </p>
              <Input
                id="listening-correct-sentence"
                value={form.correctSentence}
                onChange={(e) => setForm((prev) => ({ ...prev, correctSentence: e.target.value }))}
                placeholder="Exact text spoken in the audio"
              />
              {fieldErrors.correctSentence && (
                <p className="text-label-sm text-feedback-error">{fieldErrors.correctSentence}</p>
              )}
            </div>
          </FormSection>
        )}

        <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border-default bg-bg-page/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <Button type="button" variant="outline" onClick={() => router.push(backHref)} disabled={isSaving}>
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
