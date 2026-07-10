'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { ClipboardList, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import SidePanel from '@/components/admin/SidePanel';
import StatusToggle from '@/components/admin/StatusToggle';
import FormSection from '@/components/admin/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { TYPE_LABELS } from '@/components/shared/QuestionTypeBadge';
import {
  useAdminMockTestList,
  useCreateMockTestTemplate,
  useUpdateMockTestTemplate,
  useDeleteMockTestTemplate,
  useToggleMockTestStatus,
} from '@/hooks/queries/useAdminMockTestQueries';
import { adminMockTestFormSchema } from '@/lib/validations/admin';
import type { MockTestTemplate, MockTestQuestionRule, ModuleType } from '@/types';

/** Mirrors backend VALID_TYPES_BY_MODULE (backend/src/validators/mocktest.validators.ts) — source of truth. */
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

/** Score color logic — matches CLAUDE.md/theming: >=80 success, 50-79 warning, <50 error. */
function scoreColorClasses(score: number): { text: string; bg: string } {
  if (score >= 80) return { text: 'text-feedback-success', bg: 'bg-feedback-success-bg' };
  if (score >= 50) return { text: 'text-feedback-warning', bg: 'bg-feedback-warning-bg' };
  return { text: 'text-feedback-error', bg: 'bg-feedback-error-bg' };
}

type PanelMode = 'add' | 'edit' | null;

export default function MockTestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(urlSearch);

  useEffect(() => {
    setSearchInput(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  const debouncedUpdateSearch = useCallback(
    (value: string) => {
      if (value === urlSearch) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('search', value.trim());
      } else {
        params.delete('search');
      }
      const query = params.toString();
      router.replace(query ? `?${query}` : '?', { scroll: false });
    },
    [urlSearch, searchParams, router]
  );

  useDebouncedCallback(searchInput, debouncedUpdateSearch, 300);

  const { data, isLoading } = useAdminMockTestList(urlSearch);
  const createMutation = useCreateMockTestTemplate();
  const updateMutation = useUpdateMockTestTemplate();
  const deleteMutation = useDeleteMockTestTemplate();
  const toggleStatusMutation = useToggleMockTestStatus();

  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [editingTemplate, setEditingTemplate] = useState<MockTestTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MockTestTemplate | null>(null);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalTime, setTotalTime] = useState('60');
  const [counts, setCounts] = useState<Record<string, number>>(emptyCounts());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const templates = data?.templates ?? [];

  const totalQuestionCount = Object.values(counts).reduce((sum, n) => sum + (n || 0), 0);

  function openAddPanel() {
    setPanelMode('add');
    setEditingTemplate(null);
    setName('');
    setDescription('');
    setTotalTime('60');
    setCounts(emptyCounts());
    setFieldErrors({});
  }

  function openEditPanel(template: MockTestTemplate) {
    setPanelMode('edit');
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setTotalTime(String(template.totalTime));
    setCounts(countsFromRules(template.questionRules));
    setFieldErrors({});
  }

  function closePanel() {
    setPanelMode(null);
    setEditingTemplate(null);
    setFieldErrors({});
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

    if (panelMode === 'add') {
      createMutation.mutate(payload, { onSuccess: closePanel });
      return;
    }

    if (panelMode === 'edit' && editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, payload }, { onSuccess: closePanel });
    }
  }

  function handleToggleStatus(template: MockTestTemplate, nextValue: boolean) {
    setToggleLoadingId(template.id);
    toggleStatusMutation.mutate(
      { id: template.id, isActive: nextValue },
      { onSettled: () => setToggleLoadingId(null) }
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Mock Tests"
        subtitle="Manage full mock test templates for students"
        actions={
          <Button onClick={openAddPanel} className="gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover">
            <Plus className="size-4" />
            Create Template
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by template name"
          className="pl-9"
          aria-label="Search mock test templates by name"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-card" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={urlSearch ? 'No templates match your search' : 'No mock test templates yet'}
          description={urlSearch ? 'Try a different template name.' : 'Create your first template to get started.'}
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-border-default bg-bg-card shadow-card">
          <div className="hidden gap-4 border-b border-border-default bg-bg-page px-5 py-3 text-label-sm font-bold tracking-wide text-text-secondary uppercase md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
            <span>Template</span>
            <span>Total Questions</span>
            <span>Time Limit</span>
            <span>Attempts</span>
            <span>Avg Score</span>
            <span>Actions</span>
          </div>

          <ul className="divide-y divide-border-default">
            {templates.map((template) => {
              const totalQuestions = template.questionRules.reduce((sum, r) => sum + r.count, 0);
              const scoreColors = scoreColorClasses(template.avgScore);
              return (
                <li
                  key={template.id}
                  className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-bg-page md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] md:items-center md:gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-action-subtle text-action-default">
                      <ClipboardList className="size-4" />
                    </div>
                    <div className="min-w-0 flex items-center gap-2">
                      <div>
                        <div className="truncate text-body-sm font-semibold text-text-primary">{template.name}</div>
                        <div className="truncate text-label-md text-text-secondary">{template.description}</div>
                      </div>
                      <StatusToggle
                        isActive={template.isActive}
                        isLoading={toggleLoadingId === template.id}
                        onToggle={(next) => handleToggleStatus(template, next)}
                      />
                    </div>
                  </div>

                  <div className="text-body-sm text-text-primary md:text-center">
                    <span className="text-label-sm text-text-muted md:hidden">Total Questions: </span>
                    {totalQuestions}
                  </div>

                  <div className="text-body-sm text-text-primary md:text-center">
                    <span className="text-label-sm text-text-muted md:hidden">Time Limit: </span>
                    {template.totalTime} min
                  </div>

                  <div className="text-body-sm text-text-primary md:text-center">
                    <span className="text-label-sm text-text-muted md:hidden">Attempts: </span>
                    {template.attemptCount}
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-label-sm font-bold ${scoreColors.bg} ${scoreColors.text}`}
                    >
                      {template.avgScore}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-action-default hover:bg-action-subtle"
                      onClick={() => openEditPanel(template)}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-feedback-error hover:bg-feedback-error-bg"
                      onClick={() => setDeleteTarget(template)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <SidePanel
        isOpen={panelMode !== null}
        onClose={closePanel}
        title={panelMode === 'add' ? 'Create Template' : 'Edit Template'}
        width="640px"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="template-name" className="text-label-md text-text-primary">
              Template Name
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Mock Test 1"
            />
            {fieldErrors.name && <p className="text-label-sm text-feedback-error">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-description" className="text-label-md text-text-primary">
              Description
            </Label>
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

          <div className="space-y-1.5">
            <Label htmlFor="template-total-time" className="text-label-md text-text-primary">
              Total Time (in minutes)
            </Label>
            <Input
              id="template-total-time"
              type="number"
              min={10}
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
            />
            {fieldErrors.totalTime && (
              <p className="text-label-sm text-feedback-error">{fieldErrors.totalTime}</p>
            )}
          </div>

          <div className="space-y-3">
            {MODULES.map((module) => (
              <FormSection key={module} title={MODULE_LABELS[module]}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {VALID_TYPES_BY_MODULE[module].map((type) => (
                    <div key={type} className="space-y-1.5">
                      <Label htmlFor={`count-${module}-${type}`} className="text-label-sm text-text-secondary">
                        {TYPE_LABELS[type] ?? type}
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
          </div>

          {fieldErrors.counts && <p className="text-label-sm text-feedback-error">{fieldErrors.counts}</p>}

          <p className="text-label-sm text-text-muted">
            Set count to 0 to leave a question type out of this template.
          </p>

          <div className="rounded-card border border-border-default bg-bg-page px-4 py-3 text-label-md font-semibold text-text-primary">
            Total Questions: {totalQuestionCount}
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-action-default text-primary-foreground hover:bg-action-hover"
          >
            {isSaving ? 'Saving...' : panelMode === 'add' ? 'Create Template' : 'Save Changes'}
          </Button>
        </form>
      </SidePanel>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete this template?"
        description="Students will no longer be able to take this test."
        confirmLabel="Delete"
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
