'use client';

import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import AudioPlayer from '@/components/shared/AudioPlayer';
import MCQOption from '@/components/shared/MCQOption';
import QuestionTypeBadge from '@/components/shared/QuestionTypeBadge';
import WordCounter from '@/components/shared/WordCounter';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { countWords } from '@/lib/word-counter';
import type { MockListeningData, MockTestQuestion } from '@/types';

interface Props {
  question: Extract<MockTestQuestion, { module: 'listening' }>;
  onAnswerChange: (answer: string | string[] | number[] | null) => void;
}

// Word bands mirror the backend's fixed summariseWordCountScore (50–70 target).
const SS_MIN = 50;
const SS_MAX = 71;
const SS_WARN = 30;

// ─── Single-select family (mcq_single, select_missing) ───────────────────────

function RadioOptionsInput({
  data,
  instruction,
  onAnswerChange,
}: {
  data: MockListeningData;
  instruction: string;
  onAnswerChange: Props['onAnswerChange'];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = data.options ?? [];

  useEffect(() => {
    onAnswerChange(selected);
  }, [selected, onAnswerChange]);

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">{instruction}</p>
      <AudioPlayer audioUrl={data.audioUrl} playLimit={data.playLimit} />
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

// ─── Highlight correct summary (full-paragraph radio cards) ──────────────────

function HighlightSummaryInput({ data, onAnswerChange }: { data: MockListeningData; onAnswerChange: Props['onAnswerChange'] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = data.options ?? [];

  useEffect(() => {
    onAnswerChange(selected);
  }, [selected, onAnswerChange]);

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Listen to the audio. Select the paragraph that best summarises what you heard.
      </p>
      <AudioPlayer audioUrl={data.audioUrl} playLimit={data.playLimit} />
      <div className="space-y-2.5">
        {options.map((opt) => {
          const isSelected = selected === opt.label;
          return (
            <button
              key={opt.label}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(opt.label)}
              className={`flex w-full items-start gap-3 rounded-input border p-3.5 text-left transition-colors sm:p-4 ${
                isSelected
                  ? 'border-action-default bg-action-subtle'
                  : 'border-border-default bg-bg-card hover:border-action-default hover:bg-action-subtle'
              }`}
            >
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-label-sm font-bold ${
                  isSelected
                    ? 'border-action-default bg-action-default text-primary-foreground'
                    : 'border-border-default bg-bg-card text-text-secondary'
                }`}
              >
                {opt.label}
              </span>
              <span className="flex-1 text-body-sm leading-[1.7] text-text-primary">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── MCQ multiple ────────────────────────────────────────────────────────────

function McqMultipleInput({ data, onAnswerChange }: { data: MockListeningData; onAnswerChange: Props['onAnswerChange'] }) {
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
        Listen to the audio and select ALL correct answers. More than one option may be correct.
      </p>
      <AudioPlayer audioUrl={data.audioUrl} playLimit={data.playLimit} />
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

// ─── Fill in the blanks (inline inputs) ──────────────────────────────────────

function FillBlanksInput({ data, onAnswerChange }: { data: MockListeningData; onAnswerChange: Props['onAnswerChange'] }) {
  const blanks = data.blanks ?? [];
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const segments = (data.transcript ?? '').split('[BLANK]');

  useEffect(() => {
    const arr = blanks.map((_, i) => (answers[i] ?? '').trim());
    onAnswerChange(arr.some((a) => a) ? arr : null);
  }, [answers, blanks, onAnswerChange]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-body-md text-text-secondary">
          Listen to the audio. Type the missing words into the blank spaces in the transcript below.
        </p>
        <p className="mt-1 text-label-sm text-text-muted">Minor spelling mistakes are accepted.</p>
      </div>
      <AudioPlayer audioUrl={data.audioUrl} playLimit={data.playLimit} />
      <div className="rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
        <p className="text-body-md leading-[2.4] text-text-primary">
          {segments.map((segment, i) => (
            <span key={i}>
              {segment}
              {i < blanks.length && (
                <Input
                  value={answers[i] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                  placeholder="..."
                  className="mx-1 inline-flex h-8 w-20 min-w-20 px-2 align-middle text-body-sm sm:w-[120px]"
                />
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

// ─── Highlight incorrect words (clickable spans) ─────────────────────────────

function HighlightIncorrectInput({ data, onAnswerChange }: { data: MockListeningData; onAnswerChange: Props['onAnswerChange'] }) {
  const words = (data.transcript ?? '').split(/\s+/).filter(Boolean);
  const [clicked, setClicked] = useState<Set<number>>(new Set());
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    onAnswerChange(touched ? Array.from(clicked).sort((a, b) => a - b) : null);
  }, [clicked, touched, onAnswerChange]);

  const toggle = (index: number) => {
    setTouched(true);
    setClicked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-body-md text-text-secondary">
          Listen to the audio. Click on the words in the transcript below that are DIFFERENT from what you hear.
        </p>
        <p className="mt-1 text-label-sm text-text-muted">Click a word to mark it. Click again to unmark.</p>
      </div>
      <div className="flex items-start gap-2.5 rounded-input border border-feedback-warning/30 bg-feedback-warning-bg p-3 text-body-sm text-feedback-warning-text">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <span>Clicking a correct word deducts points.</span>
      </div>
      <AudioPlayer audioUrl={data.audioUrl} playLimit={data.playLimit} />
      <div className="rounded-card border border-border-default bg-bg-page p-4 leading-[2.6] sm:p-5 sm:leading-loose">
        {words.map((word, i) => {
          const isClicked = clicked.has(i);
          return (
            <span key={i}>
              <span
                role="button"
                tabIndex={0}
                onClick={() => toggle(i)}
                className={`inline-block cursor-pointer rounded px-1.5 py-1.5 text-body-md transition-colors sm:px-1 sm:py-0.5 ${
                  isClicked
                    ? 'bg-feedback-error-bg text-feedback-error underline'
                    : 'text-text-primary hover:bg-feedback-warning-bg'
                }`}
              >
                {word}
              </span>{' '}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Write from dictation (single input) ─────────────────────────────────────

function WriteDictationInput({ data, onAnswerChange }: { data: MockListeningData; onAnswerChange: Props['onAnswerChange'] }) {
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    onAnswerChange(answer.trim().length > 0 ? answer.trim() : null);
  }, [answer, onAnswerChange]);

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">Listen to the audio. Type exactly what you hear.</p>
      <AudioPlayer audioUrl={data.audioUrl} playLimit={data.playLimit} />
      <div className="space-y-2">
        <label className="text-label-md text-text-secondary">Your Answer</label>
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type what you hear..."
          className="h-11 border-border-default text-[16px] text-text-primary focus-visible:border-action-default sm:text-body-lg"
        />
      </div>
    </div>
  );
}

// ─── Summarise spoken text (textarea) ────────────────────────────────────────

function SummariseSpokenInput({ data, onAnswerChange }: { data: MockListeningData; onAnswerChange: Props['onAnswerChange'] }) {
  const [text, setText] = useState('');
  const wordCount = countWords(text);

  useEffect(() => {
    onAnswerChange(text.trim().length > 0 ? text : null);
  }, [text, onAnswerChange]);

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Listen to the audio. Write a 50–70 word summary of what you heard.
      </p>
      <AudioPlayer audioUrl={data.audioUrl} playLimit={data.playLimit} />
      <div className="space-y-2">
        <label className="text-label-md text-text-secondary">Your Summary</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your 50–70 word summary here..."
          className="min-h-[140px] border-border-default text-body-md text-text-primary focus-visible:border-action-default"
        />
        <WordCounter currentCount={wordCount} minCount={SS_MIN} maxCount={SS_MAX} warnCount={SS_WARN} />
      </div>
    </div>
  );
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export default function MockListeningQuestion({ question, onAnswerChange }: Props) {
  const data = question.questionData;
  const type = question.questionType;

  return (
    <div className="space-y-5">
      <QuestionTypeBadge type={type} module="listening" />
      {type === 'mcq_single' && (
        <RadioOptionsInput
          data={data}
          instruction="Listen to the audio. Select ONE correct answer."
          onAnswerChange={onAnswerChange}
        />
      )}
      {type === 'select_missing' && (
        <RadioOptionsInput
          data={data}
          instruction="The audio ends with a beep. Select the word or phrase that correctly completes what was being said."
          onAnswerChange={onAnswerChange}
        />
      )}
      {type === 'highlight_summary' && <HighlightSummaryInput data={data} onAnswerChange={onAnswerChange} />}
      {type === 'mcq_multiple' && <McqMultipleInput data={data} onAnswerChange={onAnswerChange} />}
      {type === 'fill_blanks' && <FillBlanksInput data={data} onAnswerChange={onAnswerChange} />}
      {type === 'highlight_incorrect' && <HighlightIncorrectInput data={data} onAnswerChange={onAnswerChange} />}
      {type === 'write_dictation' && <WriteDictationInput data={data} onAnswerChange={onAnswerChange} />}
      {type === 'summarise_spoken' && <SummariseSpokenInput data={data} onAnswerChange={onAnswerChange} />}
    </div>
  );
}
