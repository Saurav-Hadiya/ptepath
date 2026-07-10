'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface EditableOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

interface OptionsListEditorProps {
  options: EditableOption[];
  onChange: (options: EditableOption[]) => void;
  /** 'single' renders a radio group (exactly one correct); 'multiple' renders checkboxes (>=1 correct). */
  mode: 'single' | 'multiple';
  error?: string;
}

const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function relabel(options: EditableOption[]): EditableOption[] {
  return options.map((o, i) => ({ ...o, label: LABELS[i] ?? `${i + 1}` }));
}

export default function OptionsListEditor({ options, onChange, mode, error }: OptionsListEditorProps) {
  function addOption() {
    onChange(relabel([...options, { label: '', text: '', isCorrect: false }]));
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    onChange(relabel(options.filter((_, i) => i !== index)));
  }

  function updateText(index: number, text: string) {
    onChange(options.map((o, i) => (i === index ? { ...o, text } : o)));
  }

  function toggleCorrect(index: number, checked: boolean) {
    if (mode === 'multiple') {
      onChange(options.map((o, i) => (i === index ? { ...o, isCorrect: checked } : o)));
    } else {
      onChange(options.map((o, i) => ({ ...o, isCorrect: i === index })));
    }
  }

  const singleCorrectValue = String(options.findIndex((o) => o.isCorrect));

  return (
    <div className="space-y-2">
      {mode === 'single' ? (
        <RadioGroup
          value={singleCorrectValue}
          onValueChange={(v) => toggleCorrect(Number(v), true)}
          className="space-y-2"
        >
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <RadioGroupItem value={String(index)} aria-label={`Mark option ${option.label || index + 1} correct`} />
              <span className="w-5 shrink-0 text-label-md text-text-secondary">{option.label || LABELS[index]}</span>
              <Input
                value={option.text}
                onChange={(e) => updateText(index, e.target.value)}
                placeholder="Option text"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-feedback-error hover:bg-feedback-error-bg"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                aria-label="Remove option"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Checkbox
                checked={option.isCorrect}
                onCheckedChange={(checked) => toggleCorrect(index, checked === true)}
                aria-label={`Mark option ${option.label || index + 1} correct`}
              />
              <span className="w-5 shrink-0 text-label-md text-text-secondary">{option.label || LABELS[index]}</span>
              <Input
                value={option.text}
                onChange={(e) => updateText(index, e.target.value)}
                placeholder="Option text"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-feedback-error hover:bg-feedback-error-bg"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                aria-label="Remove option"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addOption}>
        <Plus className="size-3.5" />
        Add option
      </Button>

      {error && <p className="text-label-sm text-feedback-error">{error}</p>}
    </div>
  );
}
