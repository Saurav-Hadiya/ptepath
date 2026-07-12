'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, GripVertical, Check, X } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
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

type ContainerId = 'source-zone' | 'answer-zone';
type Containers = Record<ContainerId, string[]>;

function isContainerId(id: string): id is ContainerId {
  return id === 'source-zone' || id === 'answer-zone';
}

function findContainer(containers: Containers, id: UniqueIdentifier): ContainerId | undefined {
  const idStr = String(id);
  if (isContainerId(idStr)) return idStr;
  return (Object.keys(containers) as ContainerId[]).find((key) => containers[key].includes(idStr));
}

function ParagraphItem({
  id,
  text,
  disabled,
  resultState,
}: {
  id: string;
  text: string;
  disabled: boolean;
  resultState?: 'correct' | 'wrong';
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const stateClass = resultState
    ? resultState === 'correct'
      ? 'border-feedback-success bg-feedback-success-bg'
      : 'border-feedback-error bg-feedback-error-bg'
    : 'border-border-default bg-bg-card';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex touch-none select-none items-start gap-2 rounded-input border p-3 text-body-sm text-text-primary shadow-card transition-shadow cursor-grab active:cursor-grabbing ${stateClass} ${
        disabled ? '' : 'hover:shadow-hover'
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <GripVertical className="mt-0.5 size-4 shrink-0 text-action-default" />
      <span className="flex-1 whitespace-pre-wrap">{text}</span>
      {resultState === 'correct' && <Check className="size-4 shrink-0 text-feedback-success" />}
      {resultState === 'wrong' && <X className="size-4 shrink-0 text-feedback-error" />}
    </div>
  );
}

function ParagraphOverlay({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-input border border-action-default bg-bg-card p-3 text-body-sm text-text-primary shadow-hover">
      <GripVertical className="mt-0.5 size-4 shrink-0 text-action-default" />
      <span className="flex-1 whitespace-pre-wrap">{text}</span>
    </div>
  );
}

function Container({
  id,
  title,
  itemIds,
  itemsById,
  disabled,
  emptyLabel,
  resultStates,
}: {
  id: ContainerId;
  title: string;
  itemIds: string[];
  itemsById: Record<string, string>;
  disabled: boolean;
  emptyLabel: string;
  resultStates?: Array<'correct' | 'wrong' | undefined>;
}) {
  // Always enabled (never disabled by item count) so the container stays a valid
  // drop target even once it holds items — collision detection then refines the
  // hit to the nearest item inside it (see collisionDetectionStrategy below).
  const { setNodeRef, isOver } = useDroppable({ id, disabled });

  return (
    <div>
      <p className="mb-2 text-label-md text-text-secondary">{title}</p>
      <SortableContext id={id} items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`min-h-[160px] space-y-2 rounded-card border p-3 ${
            itemIds.length === 0 ? 'border-dashed' : ''
          } ${isOver ? 'border-action-default bg-action-subtle' : 'border-border-default bg-bg-page'}`}
        >
          {itemIds.length === 0 ? (
            <p className="p-2 text-body-sm text-text-muted">{emptyLabel}</p>
          ) : (
            itemIds.map((itemId, i) => (
              <ParagraphItem
                key={itemId}
                id={itemId}
                text={itemsById[itemId]}
                disabled={disabled}
                resultState={resultStates?.[i]}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ReorderParagraphsQuestion({ question, onScoreReceived }: Props) {
  const itemsById = useMemo(() => {
    const map: Record<string, string> = {};
    (question.paragraphs ?? []).forEach((p, i) => {
      map[`p${i}`] = p.text;
    });
    return map;
  }, [question.paragraphs]);

  const [containers, setContainers] = useState<Containers>(() => ({
    'source-zone': Object.keys(itemsById),
    'answer-zone': [],
  }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<ReorderBreakdown | null>(null);
  const mutation = useSubmitReading();
  const lastOverIdRef = useRef<UniqueIdentifier | null>(null);

  // A single PointerSensor covers mouse, touch and pen — mixing it with TouchSensor
  // causes duplicate activation on touch devices and unreliable drags.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // dnd-kit's Multiple Containers strategy: prefer whatever the pointer is
  // directly within, fall back to rect overlap, then — if that hit is a
  // container rather than an item — refine to the closest item inside it.
  // Plain closestCenter can't tell "over the container" from "over a specific
  // item", which is what silently broke cross-container drops before.
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      // Runs on every pointer move during a drag, including extreme positions far
      // outside any panel (e.g. dragged near the top/bottom edge of the screen on
      // mobile). Any unexpected throw here would crash the whole page, so this is
      // guarded defensively — worst case is a missed collision this frame, not a
      // broken attempt.
      try {
        const pointerIntersections = pointerWithin(args);
        const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
        let overId = intersections[0]?.id ?? null;

        if (overId != null) {
          const overIdStr = String(overId);
          const containerItems = isContainerId(overIdStr) ? containers[overIdStr] : null;

          if (containerItems && containerItems.length > 0) {
            const closest = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter((c) => containerItems.includes(String(c.id))),
            });
            if (closest.length > 0) {
              overId = closest[0].id;
            }
          }

          lastOverIdRef.current = overId;
          return [{ id: overId }];
        }

        return lastOverIdRef.current ? [{ id: lastOverIdRef.current }] : [];
      } catch (error) {
        console.error('Reorder collision detection failed, skipping this frame:', error);
        return [];
      }
    },
    [containers]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  // Cross-container moves happen live, on every dragover — onDragEnd only
  // finalizes same-container reordering. Both are wrapped defensively: an
  // extreme drag (far outside every panel, near the screen edge on mobile)
  // can produce rects/positions dnd-kit doesn't expect, and an uncaught throw
  // here would crash the whole attempt page instead of just cancelling the move.
  function handleDragOver(event: DragOverEvent) {
    try {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);
      const activeContainer = findContainer(containers, activeId);
      const overContainer = findContainer(containers, overId);

      if (!activeContainer || !overContainer || activeContainer === overContainer) return;

      setContainers((prev) => {
        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];
        const overIndex = overItems.indexOf(overId);
        const isOverContainerItself = overId === overContainer;

        let newIndex: number;
        if (isOverContainerItself) {
          newIndex = overItems.length;
        } else {
          const isBelowOverItem =
            active.rect.current.translated != null &&
            active.rect.current.translated.top > over.rect.top + over.rect.height;
          newIndex = overIndex >= 0 ? overIndex + (isBelowOverItem ? 1 : 0) : overItems.length;
        }

        return {
          ...prev,
          [activeContainer]: activeItems.filter((id) => id !== activeId),
          [overContainer]: [...overItems.slice(0, newIndex), activeId, ...overItems.slice(newIndex)],
        };
      });
    } catch (error) {
      console.error('Reorder drag-over failed, ignoring this move:', error);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (submitted) return;

    try {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);
      const activeContainer = findContainer(containers, activeId);
      const overContainer = findContainer(containers, overId);

      if (!activeContainer || !overContainer || activeContainer !== overContainer) return;

      const activeIndex = containers[activeContainer].indexOf(activeId);
      const overIndex = containers[overContainer].indexOf(overId);

      if (activeIndex !== overIndex && overIndex !== -1) {
        setContainers((prev) => ({
          ...prev,
          [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
        }));
      }
    } catch (error) {
      console.error('Reorder drag-end failed, drop ignored:', error);
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const handleSubmit = () => {
    const answerIds = containers['answer-zone'];
    if (answerIds.length === 0 || submitted) return;
    const answers = answerIds.map((id) => itemsById[id]);
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

  const answerResultStates = breakdown
    ? containers['answer-zone'].map((id, i) =>
        breakdown.correctSequence[i] === itemsById[id] ? ('correct' as const) : ('wrong' as const)
      )
    : undefined;

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Drag the paragraph boxes from the Source panel into the correct order in the Answer panel.
      </p>

      {question.passage && (
        <div className="rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
          <p className="whitespace-pre-wrap text-body-md leading-[1.8] text-text-primary">{question.passage}</p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        autoScroll={false}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Container
            id="source-zone"
            title="Source — Drag from here"
            itemIds={containers['source-zone']}
            itemsById={itemsById}
            disabled={submitted}
            emptyLabel="All paragraphs placed."
          />
          <Container
            id="answer-zone"
            title="Answer — Drop here in order"
            itemIds={containers['answer-zone']}
            itemsById={itemsById}
            disabled={submitted}
            emptyLabel="Drop paragraphs here to build your order."
            resultStates={answerResultStates}
          />
        </div>

        <DragOverlay>{activeId ? <ParagraphOverlay text={itemsById[activeId]} /> : null}</DragOverlay>
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
                    <span className="flex-1 whitespace-pre-wrap">{text}</span>
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
                    <span className="flex-1 whitespace-pre-wrap">{text}</span>
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
          disabled={containers['answer-zone'].length === 0 || mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your order...' : 'Submit Order'}
        </Button>
      )}
    </div>
  );
}
