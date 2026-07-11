'use client';

import { GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ReadingParagraphDraft } from './reading-validation';

const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function relabel(paragraphs: ReadingParagraphDraft[]): ReadingParagraphDraft[] {
  return paragraphs.map((p, i) => ({ ...p, label: LABELS[i] ?? `${i + 1}` }));
}

interface ItemProps {
  id: string;
  paragraph: ReadingParagraphDraft;
  onChange: (text: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function SortableParagraphItem({ id, paragraph, onChange, onRemove, canRemove }: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 rounded-input border border-border-default bg-bg-card p-3 ${isDragging ? 'opacity-40' : ''}`}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="mt-1.5 shrink-0 cursor-grab text-text-muted active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>
      <span className="mt-1.5 w-5 shrink-0 text-label-md font-semibold text-text-secondary">{paragraph.label}</span>
      <Textarea
        value={paragraph.text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paragraph text"
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="mt-1 shrink-0 text-feedback-error hover:bg-feedback-error-bg"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove paragraph"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

interface ParagraphsEditorProps {
  paragraphs: ReadingParagraphDraft[];
  onChange: (paragraphs: ReadingParagraphDraft[]) => void;
  error?: string;
}

export default function ParagraphsEditor({ paragraphs, onChange, error }: ParagraphsEditorProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const ids = paragraphs.map((_, i) => `para-${i}`);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(relabel(arrayMove(paragraphs, oldIndex, newIndex)));
  }

  function addParagraph() {
    onChange(relabel([...paragraphs, { label: '', text: '' }]));
  }

  function removeParagraph(index: number) {
    if (paragraphs.length <= 3) return;
    onChange(relabel(paragraphs.filter((_, i) => i !== index)));
  }

  function updateText(index: number, text: string) {
    onChange(paragraphs.map((p, i) => (i === index ? { ...p, text } : p)));
  }

  return (
    <div className="space-y-2">
      <p className="text-label-sm text-text-muted">
        Enter paragraphs in the CORRECT order. System shuffles for students.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {paragraphs.map((paragraph, index) => (
              <SortableParagraphItem
                key={ids[index]}
                id={ids[index]}
                paragraph={paragraph}
                onChange={(text) => updateText(index, text)}
                onRemove={() => removeParagraph(index)}
                canRemove={paragraphs.length > 3}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addParagraph}>
        <Plus className="size-3.5" />
        Add paragraph
      </Button>
      {error && <p className="text-label-sm text-feedback-error">{error}</p>}
    </div>
  );
}
