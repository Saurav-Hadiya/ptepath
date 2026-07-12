'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import FormSection from '@/components/admin/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { TYPE_LABELS } from '@/components/shared/QuestionTypeBadge';
import {
  useAdminMockTestDetail,
  useCreateMockTestTemplate,
  useUpdateMockTestTemplate,
} from '@/hooks/queries/useAdminMockTestQueries';
import { adminMockTestFormSchema } from '@/lib/validations/admin';
import { ROUTES } from '@/config/routes';
import type { MockTestQuestionRule, ModuleType } from '@/types';

const VALID_TYPES_BY_MODULE: Record<ModuleType, readonly string[]> = {
  speaking: ['read_aloud', 'repeat_sentence', 'describe_image', 'respond_situation', 'answer_short'],
  writing: ['summarise_written_text', 'write_essay'],
  reading: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'],
  listening: [
    'summarise_spoken',
    'mcq_multiple',
    'fill_blanks',
    'highlight_summary',
    'mcq_single',
    'select_missing',
    'highlight_incorrect',
    'write_dictation',
  ],
};

const MODULE_LABELS: Record<ModuleType, string> = {
  speaking: 'Speaking',
  writing: 'Writing',
  reading: 'Reading',
  listening: 'Listening',
};

const MODULES: ModuleType[] = ['speaking', 'writing', 'reading', 'listening'];

function countKey(module: ModuleType, type: string): string {
  return `${module}:${type}`;
}

function emptyCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  MODULES.forEach((module) => {
    VALID_TYPES_BY_MODULE[module].forEach((type) => {
      counts[countKey(module, type)] = 0;
    });
  });
  return counts;
}

function countsFromRules(rules: MockTestQuestionRule[]): Record<string, number> {
  const counts = emptyCounts();
  rules.forEach((rule) => {
    counts[countKey(rule.module, rule.type)] = rule.count;
  });
  return counts;
}

interface MockTestFormProps {
  mode: 'create' | 'edit';
  templateId?: string;
}

export default function MockTestForm({ mode, templateId }: MockTestFormProps) {
  const router = useRouter();
  const detailQuery = useAdminMockTestDetail(mode === 'edit' ? templateId : undefined);
  const createMutation = useCreateMockTestTemplate();
  const updateMutation = useUpdateMockTestTemplate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalTime, setTotalTime] = useState('60');
  const [counts, setCounts] = useState<Record<string, number>>(emptyCounts);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(mode === 'create');

  useEffect(() => {
    if (mode === 'edit' && detailQuery.data && !hydrated) {
      const t = detailQuery.data;
      setName(t.name);
      setDescription(t.description);
      setTotalTime(String(t.totalTime));
      setCounts(countsFromRules(t.questionRules));
      setHydrated(true);
    }
  }, [mode, detailQuery.data, hydrated]);

  if (mode === 'edit' && detailQuery.isLoading) {
    return (
      <main className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40 rounded-card" />
        <Skeleton className="h-32 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </main>
    );
  }

  if (mode === 'edit' && (detailQuery.isError || (!detailQuery.isLoading && !detailQuery.data))) {
    return (
      <main className="flex flex-col gap-4">
        <p className="text-body-sm text-feedback-error">Template not found or could not be loaded.</p>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.admin.mockTests.home} />}
        >
          Back to Mock Tests
        </Button>
      </main>
    );
  }

  function handleCountChange(module: ModuleType, type: string, value: string) {
    const n = value === '' ? 0 : Number(value);
    setCounts((prev) => ({ ...prev, [countKey(module, type)]: Number.isNaN(n) ? 0 : n }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = adminMockTestFormSchema.safeParse({ name, description, totalTime, counts });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        errs[field] = msgs?.[0] ?? '';
      }
      setFieldErrors(errs);
      return;
    }

    const questionRules: MockTestQuestionRule[] = [];
    MODULES.forEach((module) => {
      VALID_TYPES_BY_MODULE[module].forEach((type) => {
        const count = counts[countKey(module, type)] || 0;
        if (count > 0) questionRules.push({ module, type, count });
      });
    });

    const payload = {
      name: result.data.name,
      description: result.data.description,
      totalTime: result.data.totalTime,
      questionRules,
    };

    if (mode === 'create') {
      createMutation.mutate(payload, {
        onSuccess: () => router.push(ROUTES.admin.mockTests.home),
      });
    } else if (templateId) {
      updateMutation.mutate(
        { id: templateId, payload },
        { onSuccess: () => router.push(ROUTES.admin.mockTests.home) }
      );
    }
  }

  const totalQuestionCount = Object.values(counts).reduce((sum, n) => sum + (n || 0), 0);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <main className="pb-24">
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.admin.mockTests.home} />}
          className="gap-1.5 text-text-secondary"
        >
          <ArrowLeft className="size-3.5" />
          Back to Mock Tests
        </Button>
      </div>

      <PageHeader
        title={mode === 'create' ? 'Create Template' : 'Edit Template'}
        subtitle={
          mode === 'create'
            ? 'Define the structure of a new mock test by setting question counts per type.'
            : 'Update the template name, time limit, and question distribution.'
        }
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="Template Details">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Mock Test 1"
                />
                {fieldErrors.name && (
                  <p className="text-label-sm text-feedback-error">{fieldErrors.name}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="template-total-time">Total Time (minutes)</Label>
                <Input
                  id="template-total-time"
                  type="number"
                  min={10}
                  value={totalTime}
                  onChange={(e) => setTotalTime(e.target.value)}
                />
                <p className="text-label-sm text-text-muted">Minimum 10 minutes.</p>
                {fieldErrors.totalTime && (
                  <p className="text-label-sm text-feedback-error">{fieldErrors.totalTime}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-description">Description</Label>
              <Input
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Complete PTE mock test covering all 4 modules"
              />
              {fieldErrors.description && (
                <p className="text-label-sm text-feedback-error">{fieldErrors.description}</p>
              )}
            </div>
          </div>
        </FormSection>

        {MODULES.map((module) => (
          <FormSection key={module} title={`${MODULE_LABELS[module]} Questions`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {VALID_TYPES_BY_MODULE[module].map((type) => (
                <div key={type} className="flex flex-col gap-1.5">
                  <Label htmlFor={`count-${module}-${type}`} className="text-label-sm">
                    {TYPE_LABELS[type as keyof typeof TYPE_LABELS] ?? type}
                  </Label>
                  <Input
                    id={`count-${module}-${type}`}
                    type="number"
                    min={0}
                    value={counts[countKey(module, type)] ?? 0}
                    onChange={(e) => handleCountChange(module, type, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </FormSection>
        ))}

        {fieldErrors.counts && (
          <p className="text-label-sm text-feedback-error">{fieldErrors.counts}</p>
        )}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-default bg-bg-page px-4 py-3 sm:mx-0 sm:rounded-card sm:border sm:px-5">
          <p className="text-label-md font-semibold text-text-primary">
            Total Questions: <span className="text-action-default">{totalQuestionCount}</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              nativeButton={false}
              render={<Link href={ROUTES.admin.mockTests.home} />}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-1.5">
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
