'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, GripVertical, Check, X } from 'lucide-react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { useSubmitReading } from '@/hooks/queries/useReadingQueries';
import type { ReadingQuestion, ReadingScoreResult, ReorderBreakdown } from '@/types';

interface Props {
  question: ReadingQuestion;
  onScoreReceived: (score: ReadingScoreResult) => void;
}

interface ParaItem {
  id: string;
  text: string;
}

function preview(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}...` : text;
}

function SourceBox({ item, disabled }: { item: ParaItem; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { source: 'source' },
    disabled,
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex touch-none items-start gap-2 rounded-input border border-border-default bg-bg-card p-3 text-body-sm text-text-primary shadow-card cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <GripVertical className="mt-0.5 size-4 shrink-0 text-text-muted" />
      <span>{preview(item.text)}</span>
    </div>
  );
}

function AnswerBox({
  item,
  disabled,
  resultState,
}: {
  item: ParaItem;
  disabled: boolean;
  resultState?: 'correct' | 'wrong';
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { source: 'answer' },
    disabled,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const stateClass = resultState
    ? resultState === 'correct'
      ? 'border-feedback-success bg-feedback-success-bg'
      : 'border-feedback-error bg-feedback-error-bg'
    : 'border-action-default bg-action-subtle';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex touch-none items-start gap-2 rounded-input border p-3 text-body-sm text-text-primary shadow-card cursor-grab active:cursor-grabbing ${stateClass} ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <GripVertical className="mt-0.5 size-4 shrink-0 text-text-muted" />
      <span className="flex-1">{preview(item.text)}</span>
      {resultState === 'correct' && <Check className="size-4 shrink-0 text-feedback-success" />}
      {resultState === 'wrong' && <X className="size-4 shrink-0 text-feedback-error" />}
    </div>
  );
}

export default function ReorderParagraphsQuestion({ question, onScoreReceived }: Props) {
  const [source, setSource] = useState<ParaItem[]>(() =>
    (question.paragraphs ?? []).map((p, i) => ({ id: `p${i}`, text: p.text }))
  );
  const [answer, setAnswer] = useState<ParaItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<ReorderBreakdown | null>(null);
  const mutation = useSubmitReading();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const { setNodeRef: setSourceRef, isOver: isSourceOver } = useDroppable({ id: 'source-zone', disabled: submitted });
  const { setNodeRef: setAnswerRef, isOver: isAnswerOver } = useDroppable({ id: 'answer-zone', disabled: submitted });

  function handleDragEnd(event: DragEndEvent) {
    if (submitted) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeSource = active.data.current?.source as 'source' | 'answer' | undefined;

    if (activeSource === 'source') {
      const isAnswerTarget = overId === 'answer-zone' || answer.some((a) => a.id === overId);
      if (!isAnswerTarget) return;
      const item = source.find((s) => s.id === activeId);
      if (!item) return;
      setSource((prev) => prev.filter((s) => s.id !== activeId));
      setAnswer((prev) => {
        const overIndex = prev.findIndex((a) => a.id === overId);
        if (overIndex === -1) return [...prev, item];
        const next = [...prev];
        next.splice(overIndex, 0, item);
        return next;
      });
      return;
    }

    if (activeSource === 'answer') {
      if (overId === 'source-zone') {
        const item = answer.find((a) => a.id === activeId);
        if (!item) return;
        setAnswer((prev) => prev.filter((a) => a.id !== activeId));
        setSource((prev) => [...prev, item]);
        return;
      }

      if (activeId !== overId && answer.some((a) => a.id === overId)) {
        setAnswer((prev) => {
          const oldIndex = prev.findIndex((a) => a.id === activeId);
          const newIndex = prev.findIndex((a) => a.id === overId);
          return arrayMove(prev, oldIndex, newIndex);
        });
      }
    }
  }

  const handleSubmit = () => {
    if (answer.length === 0 || submitted) return;
    const answers = answer.map((a) => a.text);
    mutation.mutate(
      { questionId: question.id, questionType: 'reorder_paragraphs', answers },
      {
        onSuccess: (result) => {
          setBreakdown(result.breakdown as ReorderBreakdown);
          setSubmitted(true);
          onScoreReceived(result);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  };

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Drag the paragraph boxes from the left panel into the correct order in the right panel.
      </p>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-label-md text-text-secondary">Source — Drag from here</p>
            <div
              ref={setSourceRef}
              className={`min-h-[160px] space-y-2 rounded-card border p-3 ${
                isSourceOver ? 'border-action-default bg-action-subtle' : 'border-border-default bg-bg-page'
              }`}
            >
              {source.length === 0 ? (
                <p className="p-2 text-body-sm text-text-muted">All paragraphs placed.</p>
              ) : (
                source.map((item) => <SourceBox key={item.id} item={item} disabled={submitted} />)
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-label-md text-text-secondary">Answer — Drop here in order</p>
            <div
              ref={setAnswerRef}
              className={`min-h-[160px] space-y-2 rounded-card border p-3 ${
                answer.length === 0 ? 'border-dashed' : ''
              } ${isAnswerOver ? 'border-action-default bg-action-subtle' : 'border-border-default bg-bg-card'}`}
            >
              {answer.length === 0 ? (
                <p className="p-2 text-body-sm text-text-muted">Drop paragraphs here to build your order.</p>
              ) : (
                <SortableContext items={answer.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                  {answer.map((item, i) => (
                    <AnswerBox
                      key={item.id}
                      item={item}
                      disabled={submitted}
                      resultState={
                        breakdown
                          ? breakdown.correctSequence[i] === item.text
                            ? 'correct'
                            : 'wrong'
                          : undefined
                      }
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </div>
        </div>
      </DndContext>

      {breakdown && (
        <div className="rounded-card border border-border-default bg-bg-page p-4">
          <p className="mb-3 text-body-sm font-semibold text-text-primary">
            {breakdown.correctPairs} / {breakdown.totalPairs} pairs in correct order
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-label-sm text-text-secondary">Your Order</p>
              <ol className="space-y-1.5">
                {breakdown.studentSequence.map((text, i) => (
                  <li key={i} className="flex items-start gap-2 text-body-sm text-text-primary">
                    <span className="shrink-0 font-semibold">{i + 1}.</span>
                    <span className="flex-1">{preview(text)}</span>
                    {breakdown.correctSequence[i] === text ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-feedback-success" />
                    ) : (
                      <X className="mt-0.5 size-4 shrink-0 text-feedback-error" />
                    )}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="mb-2 text-label-sm text-text-secondary">Correct Order</p>
              <ol className="space-y-1.5">
                {breakdown.correctSequence.map((text, i) => (
                  <li key={i} className="flex items-start gap-2 text-body-sm text-text-primary">
                    <span className="shrink-0 font-semibold">{i + 1}.</span>
                    <span className="flex-1">{preview(text)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {!submitted && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={answer.length === 0 || mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your order...' : 'Submit Order'}
        </Button>
      )}
    </div>
  );
}
