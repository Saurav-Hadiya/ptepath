import { Mic, PenLine, BookOpen, Headphones } from 'lucide-react';

const MODULES = [
  {
    key: 'speaking',
    Icon: Mic,
    label: 'Speaking',
    borderColor: 'border-l-module-speaking',
    iconBg: 'bg-module-speaking/10',
    iconColor: 'text-module-speaking',
    description:
      'Develop fluency and pronunciation across five task types with AI-powered speech scoring and immediate feedback.',
    types: ['Read Aloud', 'Repeat Sentence', 'Describe Image', 'Retell Lecture', 'Short Questions'],
  },
  {
    key: 'writing',
    Icon: PenLine,
    label: 'Writing',
    borderColor: 'border-l-module-writing',
    iconBg: 'bg-module-writing/10',
    iconColor: 'text-module-writing',
    description:
      'Sharpen academic writing with instant feedback on grammar, structure, vocabulary, and coherence.',
    types: ['Summarize Written Text', 'Write Essay'],
  },
  {
    key: 'reading',
    Icon: BookOpen,
    label: 'Reading',
    borderColor: 'border-l-module-reading',
    iconBg: 'bg-module-reading/10',
    iconColor: 'text-module-reading',
    description:
      'Build speed and comprehension across all PTE reading question formats with detailed answer review.',
    types: ['Multiple Choice', 'Reorder Paragraphs', 'Fill in Blanks', 'R/W Blanks', 'Select Missing Word'],
  },
  {
    key: 'listening',
    Icon: Headphones,
    label: 'Listening',
    borderColor: 'border-l-module-listening',
    iconBg: 'bg-module-listening/10',
    iconColor: 'text-module-listening',
    description:
      'Train your listening skills across seven task types with diverse audio content and answer review.',
    types: [
      'Summarize Spoken Text',
      'Multiple Choice',
      'Fill in Blanks',
      'Highlight Correct Summary',
      'Select Missing Word',
      'Highlight Incorrect Words',
      'Write from Dictation',
    ],
  },
];

export default function ModulesSection() {
  return (
    <section id="modules" className="bg-bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full bg-action-subtle px-4 py-1.5 text-label-sm font-semibold text-action-default">
            All Modules
          </span>
          <h2 className="font-display text-display-md font-bold text-text-primary">
            Master every PTE question type
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-body-lg text-text-secondary">
            Practice each module individually with question-type specific guidance and instant feedback on every attempt.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {MODULES.map(({ key, Icon, label, borderColor, iconBg, iconColor, description, types }) => (
            <div
              key={key}
              className={`rounded-2xl border border-l-4 border-border-default ${borderColor} bg-bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-hover sm:p-7`}
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <h3 className="mb-2 font-display text-display-sm font-bold text-text-primary">
                {label}
              </h3>
              <p className="mb-4 text-body-sm text-text-secondary">{description}</p>
              <div className="flex flex-wrap gap-1.5">
                {types.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-border-default bg-bg-page px-2.5 py-1 text-label-sm text-text-muted"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
