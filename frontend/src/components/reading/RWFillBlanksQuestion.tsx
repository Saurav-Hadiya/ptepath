'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import AnswerResult from '@/components/shared/AnswerResult';
import { useSubmitReading } from '@/hooks/queries/useReadingQueries';
import type { ReadingQuestion, ReadingScoreResult, FillBlanksBreakdown } from '@/types';

interface Props {
  question: ReadingQuestion;
  onScoreReceived: (score: ReadingScoreResult) => void;
}

interface PoolItem {
  id: string;
  word: string;
}

interface DndState {
  pool: PoolItem[];
  blanks: Array<PoolItem | null>;
}

function WordChip({
  id,
  word,
  data,
  disabled,
}: {
  id: string;
  word: string;
  data: Record<string, unknown>;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data, disabled });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      disabled={disabled}
      className={`min-h-10 touch-none cursor-grab rounded-input border border-border-default bg-bg-card px-3 py-2 text-body-sm text-text-primary shadow-card active:cursor-grabbing disabled:cursor-default disabled:opacity-60 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {word}
    </button>
  );
}

function BlankDropZone({
  index,
  item,
  disabled,
  resultState,
}: {
  index: number;
  item: PoolItem | null;
  disabled: boolean;
  resultState?: 'correct' | 'wrong';
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `blank-${index}`, disabled });
  const { setNodeRef: setDragRef, listeners, attributes } = useDraggable({
    id: `filled-blank-${index}`,
    data: { source: 'blank', index, item },
    disabled: disabled || !item,
  });

  const stateClass = resultState
    ? resultState === 'correct'
      ? 'border-feedback-success bg-feedback-success-bg text-feedback-success-text'
      : 'border-feedback-error bg-feedback-error-bg text-feedback-error-text'
    : item
      ? 'border-action-default bg-action-subtle text-brand-primary'
      : 'border-dashed border-border-default bg-bg-page text-text-muted';

  return (
    <span
      ref={setDropRef}
      className={`mx-1 inline-flex min-h-10 min-w-28 items-center justify-center rounded-input border px-3 py-1.5 align-middle text-body-sm font-medium ${stateClass} ${
        isOver ? 'ring-2 ring-action-default' : ''
      }`}
    >
      {item ? (
        <span
          ref={setDragRef}
          {...listeners}
          {...attributes}
          className={disabled ? undefined : 'touch-none cursor-grab'}
        >
          {item.word}
        </span>
      ) : (
        'Drop here'
      )}
    </span>
  );
}

export default function RWFillBlanksQuestion({ question, onScoreReceived }: Props) {
  const blanksCount = question.blanks?.length ?? 0;
  const [state, setState] = useState<DndState>(() => ({
    pool: (question.wordPool ?? []).map((word, i) => ({ id: `w${i}`, word })),
    blanks: Array.from({ length: blanksCount }, () => null),
  }));
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<FillBlanksBreakdown | null>(null);
  const mutation = useSubmitReading();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    if (submitted) return;
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as { source: 'pool' | 'blank'; item: PoolItem; index?: number };
    const overId = String(over.id);

    setState((prev) => {
      const pool = [...prev.pool];
      const blanks = [...prev.blanks];

      if (overId === 'pool-zone') {
        if (activeData.source === 'pool') return prev;
        blanks[activeData.index!] = null;
        pool.push(activeData.item);
        return { pool, blanks };
      }

      if (overId.startsWith('blank-')) {
        const targetIndex = Number(overId.slice('blank-'.length));
        if (activeData.source === 'blank' && activeData.index === targetIndex) return prev;

        const displaced = blanks[targetIndex];

        if (activeData.source === 'pool') {
          const poolIdx = pool.findIndex((w) => w.id === activeData.item.id);
          if (poolIdx !== -1) pool.splice(poolIdx, 1);
          blanks[targetIndex] = activeData.item;
          if (displaced) pool.push(displaced);
        } else if (activeData.index !== undefined) {
          blanks[targetIndex] = activeData.item;
          blanks[activeData.index] = displaced;
        }
        return { pool, blanks };
      }

      return prev;
    });
  }

  const handleSubmit = () => {
    if (submitted) return;
    const answers = state.blanks.map((b) => b?.word ?? '');
    mutation.mutate(
      { questionId: question.id, questionType: 'rw_fill_blanks', answers },
      {
        onSuccess: (result) => {
          setBreakdown(result.breakdown as FillBlanksBreakdown);
          setSubmitted(true);
          onScoreReceived(result);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  };

  const { setNodeRef: setPoolRef, isOver: isPoolOver } = useDroppable({ id: 'pool-zone', disabled: submitted });
  const segments = question.passage.split('[BLANK]');

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Drag words from the box below into the correct blank spaces.
      </p>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
          <p className="whitespace-pre-wrap text-body-md leading-[2.4] text-text-primary">
            {segments.map((segment, i) => (
              <span key={i}>
                {segment}
                {i < blanksCount && (
                  <BlankDropZone
                    index={i}
                    item={state.blanks[i]}
                    disabled={submitted}
                    resultState={breakdown ? (breakdown.breakdown[i]?.correct ? 'correct' : 'wrong') : undefined}
                  />
                )}
              </span>
            ))}
          </p>
        </div>

        {!submitted && (
          <div
            ref={setPoolRef}
            className={`flex min-h-16 flex-wrap gap-2 rounded-card border p-4 ${
              isPoolOver ? 'border-action-default bg-action-subtle' : 'border-border-default bg-bg-card'
            }`}
          >
            {state.pool.length === 0 ? (
              <span className="text-body-sm text-text-muted">All words placed.</span>
            ) : (
              state.pool.map((item) => (
                <WordChip key={item.id} id={item.id} word={item.word} data={{ source: 'pool', item }} />
              ))
            )}
          </div>
        )}
      </DndContext>

      {breakdown && (
        <div className="space-y-2">
          {breakdown.breakdown.map((b) => (
            <AnswerResult key={b.blank} state={b.correct ? 'correct' : 'wrong'}>
              Blank {b.blank}: {b.correct ? `"${b.studentAnswer}" is correct.` : `You chose "${b.studentAnswer || '(none)'}" — correct answer: "${b.correctAnswer}"`}
            </AnswerResult>
          ))}
        </div>
      )}

      {!submitted && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your answers...' : 'Submit Answers'}
        </Button>
      )}
    </div>
  );
}
