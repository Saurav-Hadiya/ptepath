import { Mic, PenLine, BookOpen, Headphones, HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuestionTypeBadgeProps {
  type: string;
  module: string;
}

const TYPE_LABELS: Record<string, string> = {
  read_aloud: 'Read Aloud',
  repeat_sentence: 'Repeat Sentence',
  describe_image: 'Describe Image',
  respond_situation: 'Respond to Situation',
  answer_short: 'Answer Short Question',
  summarise_written_text: 'Summarise Written Text',
  write_essay: 'Write Essay',
  rw_fill_blanks: 'R&W Fill in the Blanks',
  mcq_multiple: 'MCQ Multiple Answers',
  reorder_paragraphs: 'Re-order Paragraphs',
  reading_fill_blanks: 'Reading Fill in the Blanks',
  mcq_single: 'MCQ Single Answer',
  summarise_spoken: 'Summarise Spoken Text',
  fill_blanks: 'Fill in the Blanks',
  highlight_summary: 'Highlight Correct Summary',
  highlight_incorrect: 'Highlight Incorrect Words',
  select_missing: 'Select Missing Word',
  write_dictation: 'Write from Dictation',
};

const MODULE_ICONS: Record<string, LucideIcon> = {
  speaking: Mic,
  writing: PenLine,
  reading: BookOpen,
  listening: Headphones,
};

export default function QuestionTypeBadge({ type, module }: QuestionTypeBadgeProps) {
  const label = TYPE_LABELS[type] ?? `${module} - ${type}`;
  const Icon = MODULE_ICONS[module] ?? HelpCircle;

  return (
    <Badge className="gap-1.5 rounded-pill border border-action-default/20 bg-action-subtle px-2.5 py-1 text-label-sm font-bold tracking-wide text-action-default uppercase">
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
