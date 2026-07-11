'use client';

interface TranscriptWordPickerProps {
  transcript: string;
  selectedIndices: number[];
  onChange: (indices: number[]) => void;
}

/** Clickable word-by-word rendering of a transcript — admin marks words that differ from the audio. */
export default function TranscriptWordPicker({ transcript, selectedIndices, onChange }: TranscriptWordPickerProps) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const selected = new Set(selectedIndices);

  function toggleWord(index: number) {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    onChange(Array.from(next).sort((a, b) => a - b));
  }

  if (words.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 rounded-input border border-border-default bg-bg-page p-3">
      {words.map((word, index) => (
        <button
          key={index}
          type="button"
          onClick={() => toggleWord(index)}
          className={`rounded-[4px] px-1.5 py-0.5 text-body-sm transition-colors ${
            selected.has(index)
              ? 'bg-feedback-error-bg text-feedback-error'
              : 'text-text-primary hover:bg-action-subtle'
          }`}
        >
          {word}
        </button>
      ))}
    </div>
  );
}
