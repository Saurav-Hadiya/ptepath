'use client';

import { useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MCQOption from '@/components/shared/MCQOption';
import QuestionTypeBadge from '@/components/shared/QuestionTypeBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MockReadingData, MockTestQuestion } from '@/types';

interface Props {
  question: Extract<MockTestQuestion, { module: 'reading' }>;
  onAnswerChange: (answer: string | string[] | null) => void;
}

function Passage({ text }: { text: string }) {
  return (
    <div className="max-h-[30vh] overflow-y-auto rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
      <p className="whitespace-pre-wrap text-body-md leading-[1.8] text-text-primary">{text}</p>
    </div>
  );
}

// ─── MCQ single ──────────────────────────────────────────────────────────────

function McqSingleInput({ data, onAnswerChange }: { data: MockReadingData; onAnswerChange: Props['onAnswerChange'] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = data.options ?? [];

  useEffect(() => {
    onAnswerChange(selected);
  }, [selected, onAnswerChange]);

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">Read the passage. Select ONE correct answer.</p>
      <Passage text={data.passage} />
      {data.question && <p className="text-body-md font-medium text-text-primary">{data.question}</p>}
      <div className="space-y-2">
        {options.map((opt) => (
          <MCQOption
            key={opt.label}
            label={opt.label}
            text={opt.text}
            selected={selected === opt.label}
            onChange={(label) => setSelected(label)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MCQ multiple ────────────────────────────────────────────────────────────

function McqMultipleInput({ data, onAnswerChange }: { data: MockReadingData; onAnswerChange: Props['onAnswerChange'] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const options = data.options ?? [];

  useEffect(() => {
    onAnswerChange(selected.length > 0 ? selected : null);
  }, [selected, onAnswerChange]);

  const toggle = (label: string) =>
    setSelected((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Read the passage. Select ALL correct answers. More than one option may be correct.
      </p>
      <Passage text={data.passage} />
      {data.question && <p className="text-body-md font-medium text-text-primary">{data.question}</p>}
      <div className="space-y-2">
        {options.map((opt) => (
          <MCQOption
            key={opt.label}
            label={opt.label}
            text={opt.text}
            selected={selected.includes(opt.label)}
            multiSelect
            onChange={toggle}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Reading fill in the blanks (dropdowns) ──────────────────────────────────

function SelectBlanksInput({ data, onAnswerChange }: { data: MockReadingData; onAnswerChange: Props['onAnswerChange'] }) {
  const blanks = data.blanks ?? [];
  const [selections, setSelections] = useState<Record<number, string>>({});
  const segments = data.passage.split('[BLANK]');

  useEffect(() => {
    const answers = blanks.map((_, i) => selections[i] ?? '');
    onAnswerChange(answers.some((a) => a) ? answers : null);
  }, [selections, blanks, onAnswerChange]);

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Read the passage. Select the correct word from each dropdown.
      </p>
      <div className="rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
        <p className="whitespace-pre-wrap text-body-md leading-[2.4] text-text-primary">
          {segments.map((segment, i) => (
            <span key={i}>
              {segment}
              {i < blanks.length && (
                <span className="mx-1 inline-block align-middle">
                  <Select
                    value={selections[i] ?? ''}
                    onValueChange={(value) => {
                      if (value) setSelections((prev) => ({ ...prev, [i]: value }));
                    }}
                  >
                    <SelectTrigger className="h-8 min-w-32">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="w-auto min-w-[--anchor-width] max-w-[min(20rem,90vw)]">
                      {(blanks[i].options ?? []).map((opt) => (
                        <SelectItem key={opt} value={opt} className="whitespace-normal">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

// ─── R&W fill in the blanks (drag words into blanks) ─────────────────────────

interface PoolItem {
  id: string;
  word: string;
}

function WordChip({ id, word, data }: { id: string; word: string; data: Record<string, unknown> }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`min-h-10 touch-none cursor-grab rounded-input border border-border-default bg-bg-card px-3 py-2 text-body-sm text-text-primary shadow-card transition-colors hover:border-action-default hover:bg-action-subtle active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {word}
    </button>
  );
}

function BlankDropZone({ index, item }: { index: number; item: PoolItem | null }) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `blank-${index}` });
  const { setNodeRef: setDragRef, listeners, attributes } = useDraggable({
    id: `filled-blank-${index}`,
    data: { source: 'blank', index, item },
    disabled: !item,
  });
  const stateClass = item
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
          className="touch-none cursor-grab rounded-input px-1 transition-shadow hover:shadow-hover active:cursor-grabbing"
        >
          {item.word}
        </span>
      ) : (
        'Drop here'
      )}
    </span>
  );
}

function DragBlanksInput({ data, onAnswerChange }: { data: MockReadingData; onAnswerChange: Props['onAnswerChange'] }) {
  const blanksCount = data.blanks?.length ?? 0;
  const [pool, setPool] = useState<PoolItem[]>(() =>
    (data.wordPool ?? []).map((word, i) => ({ id: `w${i}`, word }))
  );
  const [blanks, setBlanks] = useState<Array<PoolItem | null>>(() =>
    Array.from({ length: blanksCount }, () => null)
  );
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const segments = data.passage.split('[BLANK]');

  useEffect(() => {
    const answers = blanks.map((b) => b?.word ?? '');
    onAnswerChange(answers.some((a) => a) ? answers : null);
  }, [blanks, onAnswerChange]);

  const { setNodeRef: setPoolRef, isOver: isPoolOver } = useDroppable({ id: 'pool-zone' });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as { source: 'pool' | 'blank'; item: PoolItem; index?: number };
    const overId = String(over.id);

    if (overId === 'pool-zone') {
      if (activeData.source === 'pool') return;
      setBlanks((prev) => {
        const next = [...prev];
        next[activeData.index!] = null;
        return next;
      });
      setPool((prev) => [...prev, activeData.item]);
      return;
    }

    if (overId.startsWith('blank-')) {
      const targetIndex = Number(overId.slice('blank-'.length));
      if (activeData.source === 'blank' && activeData.index === targetIndex) return;

      setBlanks((prevBlanks) => {
        const nextBlanks = [...prevBlanks];
        const displaced = nextBlanks[targetIndex];

        if (activeData.source === 'pool') {
          setPool((prevPool) => {
            const nextPool = prevPool.filter((w) => w.id !== activeData.item.id);
            if (displaced) nextPool.push(displaced);
            return nextPool;
          });
          nextBlanks[targetIndex] = activeData.item;
        } else if (activeData.index !== undefined) {
          nextBlanks[targetIndex] = activeData.item;
          nextBlanks[activeData.index] = displaced;
        }
        return nextBlanks;
      });
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Drag words from the box below into the correct blank spaces.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
          <p className="whitespace-pre-wrap text-body-md leading-[2.4] text-text-primary">
            {segments.map((segment, i) => (
              <span key={i}>
                {segment}
                {i < blanksCount && <BlankDropZone index={i} item={blanks[i]} />}
              </span>
            ))}
          </p>
        </div>

        <div
          ref={setPoolRef}
          className={`flex min-h-16 flex-wrap gap-2 rounded-card border p-4 ${
            isPoolOver ? 'border-action-default bg-action-subtle' : 'border-border-default bg-bg-card'
          }`}
        >
          {pool.length === 0 ? (
            <span className="text-body-sm text-text-muted">All words placed.</span>
          ) : (
            pool.map((item) => (
              <WordChip key={item.id} id={item.id} word={item.word} data={{ source: 'pool', item }} />
            ))
          )}
        </div>
      </DndContext>
    </div>
  );
}

// ─── Reorder paragraphs ──────────────────────────────────────────────────────

interface ParaItem {
  id: string;
  text: string;
}

function SourceBox({ item }: { item: ParaItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { source: 'source' },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex touch-none cursor-grab items-start gap-2 rounded-input border border-border-default bg-bg-card p-3 text-body-sm text-text-primary shadow-card transition-colors hover:border-action-default hover:bg-action-subtle active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <GripVertical className="mt-0.5 size-4 shrink-0 text-action-default" />
      <span className="whitespace-pre-wrap">{item.text}</span>
    </div>
  );
}

function AnswerBox({ item }: { item: ParaItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { source: 'answer' },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex touch-none cursor-grab items-start gap-2 rounded-input border border-action-default bg-action-subtle p-3 text-body-sm text-text-primary shadow-card transition-shadow hover:shadow-hover active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <GripVertical className="mt-0.5 size-4 shrink-0 text-action-default" />
      <span className="flex-1 whitespace-pre-wrap">{item.text}</span>
    </div>
  );
}

function ReorderInput({ data, onAnswerChange }: { data: MockReadingData; onAnswerChange: Props['onAnswerChange'] }) {
  const [source, setSource] = useState<ParaItem[]>(() =>
    (data.paragraphs ?? []).map((p, i) => ({ id: `p${i}`, text: p.text }))
  );
  const [answer, setAnswer] = useState<ParaItem[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    onAnswerChange(answer.length > 0 ? answer.map((a) => a.text) : null);
  }, [answer, onAnswerChange]);

  const { setNodeRef: setSourceRef, isOver: isSourceOver } = useDroppable({ id: 'source-zone' });
  const { setNodeRef: setAnswerRef, isOver: isAnswerOver } = useDroppable({
    id: 'answer-zone',
    disabled: answer.length > 0,
  });

  function handleDragEnd(event: DragEndEvent) {
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

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Drag the paragraph boxes from the Source panel into the correct order in the Answer panel.
      </p>
      {data.passage && <Passage text={data.passage} />}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                source.map((item) => <SourceBox key={item.id} item={item} />)
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
                  {answer.map((item) => (
                    <AnswerBox key={item.id} item={item} />
                  ))}
                </SortableContext>
              )}
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export default function MockReadingQuestion({ question, onAnswerChange }: Props) {
  const data = question.questionData;

  return (
    <div className="space-y-5">
      <QuestionTypeBadge type={question.questionType} module="reading" />
      {question.questionType === 'mcq_single' && <McqSingleInput data={data} onAnswerChange={onAnswerChange} />}
      {question.questionType === 'mcq_multiple' && <McqMultipleInput data={data} onAnswerChange={onAnswerChange} />}
      {question.questionType === 'reading_fill_blanks' && (
        <SelectBlanksInput data={data} onAnswerChange={onAnswerChange} />
      )}
      {question.questionType === 'rw_fill_blanks' && <DragBlanksInput data={data} onAnswerChange={onAnswerChange} />}
      {question.questionType === 'reorder_paragraphs' && <ReorderInput data={data} onAnswerChange={onAnswerChange} />}
    </div>
  );
}
