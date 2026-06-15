# 17 — Shared Components

## What This Is

Claude Code instruction file.
Tell Claude Code: "Read instructions/16-shared-components.md and implement exactly what is described."

---

## What to Build

## Important — Use Semantic CSS Variables

All components must use semantic CSS variable names from docs/md/theming.md.
Never hardcode hex values. Never use old --color-\* naming.

Quick reference for most used variables:

- Sidebar/navbar background: var(--brand-primary)
- Primary buttons: var(--action-default)
- Button hover: var(--action-hover)
- Page background: var(--bg-page)
- Card background: var(--bg-card)
- Primary text: var(--text-primary)
- Secondary text: var(--text-secondary)
- Muted text: var(--text-muted)
- Borders: var(--border-default)
- Correct answer: var(--feedback-success)
- Wrong answer: var(--feedback-error)
- Missed answer: var(--feedback-warning)
- Score high (80-90): var(--feedback-success)
- Score mid (50-79): var(--feedback-warning)
- Score low (0-49): var(--feedback-error)
- Speaking module accent: var(--module-speaking)
- Writing module accent: var(--module-writing)
- Reading module accent: var(--module-reading)
- Listening module accent: var(--module-listening)

All reusable UI components used across the entire platform.
These components are built once and used everywhere.
Build these before any page — pages import from here.

---

## Reference Docs

- `docs/md/theming.md` — colors, typography, spacing
- `design_reference/Section1_Public_Auth_Pages.html` — auth page components
- `design_reference/Section2_Student_Portal.html` — student components
- `design_reference/Section3_Admin_Portal.html` — admin components

---

## Prerequisites

- `15-frontend-foundation.md` complete
- shadcn/ui installed and initialized
- All CSS variables in globals.css

---

## Component 1 — `src/components/shared/Logo.tsx`

```typescript
Server Component

Props: {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
}

Renders:
  - Blue rounded square icon with circle + amber dot (see landing page logo)
  - "PTE" text + "Path" in amber
  - Font: Outfit, font-weight: 800
  - dark variant: navy text (for light backgrounds)
  - light variant: white text (for dark/navy backgrounds)

Sizes:
  sm: icon 28px, text 1rem
  md: icon 32px, text 1.15rem (default)
  lg: icon 40px, text 1.4rem
```

---

## Component 2 — `src/components/shared/PageHeader.tsx`

```typescript
Server Component

Props: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

Renders:
  - Page title: Outfit font, 1.4rem, font-weight 800, color navy
  - Subtitle: Inter font, 0.85rem, color slate
  - Actions slot: right-aligned buttons/controls
  - Bottom margin: 24px
  - No background — transparent (sits on off-white page)
```

---

## Component 3 — `src/components/shared/StatCard.tsx`

```typescript
Server Component

Props: {
  value: string | number
  label: string
  subtext?: string
  subtextColor?: 'success' | 'muted'
}

Renders:
  - White card with border and card radius
  - Value: Outfit font, 1.8rem, font-weight 800, navy
  - Label: Inter, 0.75rem, slate
  - Subtext: 0.72rem, color based on subtextColor
  - Padding: 16px 20px
  - Shadow: var(--shadow-card)

Reference: Section2_Student_Portal.html — Dashboard stat cards
```

---

## Component 4 — `src/components/shared/ModuleCard.tsx`

```typescript
'use client'

Props: {
  module: 'speaking' | 'writing' | 'reading' | 'listening'
  questionCount?: number
  onClick?: () => void
  href?: string
}

Module config (internal):
  speaking:  { icon: '🎤', label: 'Speaking',  color: var(--color-speaking) }
  writing:   { icon: '✍️', label: 'Writing',   color: var(--color-writing) }
  reading:   { icon: '📖', label: 'Reading',   color: var(--color-reading) }
  listening: { icon: '🎧', label: 'Listening', color: var(--color-listening) }

Renders:
  - White card with 3px top border in module color
  - Module icon (large emoji)
  - Module name: Outfit 0.9rem, font-weight 700, navy
  - Question count: Inter 0.75rem, slate
  - Arrow indicator bottom right
  - Hover: translateY(-3px) + shadow-hover
  - If href provided: wrap in Next.js Link
  - If onClick provided: call on click

Reference: Section2_Student_Portal.html — Dashboard module cards
```

---

## Component 5 — `src/components/shared/ScoreDisplay.tsx`

```typescript
'use client'

Props: {
  score: number          — 0 to 90
  label?: string         — e.g. "Your Score"
  size?: 'sm' | 'md' | 'lg'
}

Score color logic (from theming.md):
  score >= 80 → var(--color-success)   green
  score 50-79 → var(--color-warning)   amber
  score < 50  → var(--color-error)     red

Renders:
  - Score number in correct color
  - "/ 90" in muted color
  - Optional label above
  - Font: Outfit, bold

Sizes:
  sm: score 1.5rem, label 0.72rem
  md: score 2.4rem, label 0.82rem (default)
  lg: score 4rem, label 1rem
```

---

## Component 6 — `src/components/shared/ScoreBreakdownCard.tsx`

```typescript
'use client'

Props: {
  title: string          — e.g. "Your Score"
  displayScore: string   — e.g. "72 / 90"
  finalScore: number     — for color logic
  bars: Array<{
    label: string
    score: number
    color?: string
  }>
  feedback: string
  onNext?: () => void
  nextLabel?: string     — default "Try Another Question →"
}

Renders:
  - Card with title
  - Large score display (ScoreDisplay component)
  - Progress bars for each criterion:
    Bar label (left), progress bar (middle), score % (right)
    Bar fill color based on score (green/amber/red)
  - Feedback text in blue info box
  - Next button (if onNext provided)

Reference: Section2_Student_Portal.html
Look at score result panel in Reference 4 (Speaking Attempt)
```

---

## Component 7 — `src/components/shared/TimerDisplay.tsx`

```typescript
'use client'

Props: {
  seconds: number        — remaining seconds
  totalSeconds: number   — total time (for color logic)
  label?: string
}

Behaviour:
  Normal state: navy background, white text
  Warning state (under 20% remaining): amber background + text
  Danger state (under 10% remaining): red background + text

Renders:
  - Large countdown: MM:SS format
  - Font: Outfit, 2rem, font-weight 800
  - Background changes based on state
  - Letter spacing: 2px

Reference: Section2_Student_Portal.html
Look at timer in info panel (Speaking Attempt Reference 4)
```

---

## Component 8 — `src/components/shared/AudioPlayer.tsx`

```typescript
'use client'

Props: {
  audioUrl: string
  playLimit: number      — 1=once, 0=unlimited
  onPlayLimitReached?: () => void
}

State:
  isPlaying: boolean
  currentTime: number
  duration: number
  playsUsed: number

Renders:
  - Play/pause button (blue circle)
  - Waveform progress bar (decorative — not real waveform)
    Shows playback progress as filled bar
  - Current time / Duration display
  - Play limit badge: "Plays once" or "Unlimited" or "1 play remaining"
  - When play limit reached: disable play button, show "No more plays"

Behaviour:
  - Uses HTML5 <audio> element internally
  - On play: increment playsUsed
  - If playsUsed >= playLimit (and playLimit > 0): block further play
  - Call onPlayLimitReached when limit hit

Reference: Section2_Student_Portal.html
Look at audio player in Reference 7 (Listening Attempt)
```

---

## Component 9 — `src/components/shared/QuestionTypeBadge.tsx`

```typescript
Server Component

Props: {
  type: string           — e.g. "read_aloud"
  module: string         — e.g. "speaking"
}

Type label mapping:
  read_aloud              → "🎤 Read Aloud"
  repeat_sentence         → "🎤 Repeat Sentence"
  describe_image          → "🎤 Describe Image"
  respond_situation       → "🎤 Respond to Situation"
  answer_short            → "🎤 Answer Short Question"
  summarise_written_text  → "✍️ Summarise Written Text"
  write_essay             → "✍️ Write Essay"
  rw_fill_blanks          → "📖 R&W Fill in the Blanks"
  mcq_multiple            → "📖 MCQ Multiple Answers"
  reorder_paragraphs      → "📖 Re-order Paragraphs"
  reading_fill_blanks     → "📖 Reading Fill in the Blanks"
  mcq_single              → "📖 MCQ Single Answer"
  summarise_spoken        → "🎧 Summarise Spoken Text"
  fill_blanks             → "🎧 Fill in the Blanks"
  highlight_summary       → "🎧 Highlight Correct Summary"
  highlight_incorrect     → "🎧 Highlight Incorrect Words"
  select_missing          → "🎧 Select Missing Word"
  write_dictation         → "🎧 Write from Dictation"

Renders:
  - Blue pale background badge
  - Blue text
  - Pill border radius
  - Font: Inter, 0.72rem, font-weight 700, uppercase, letter-spacing 0.5px
```

---

## Component 10 — `src/components/shared/AnswerResult.tsx`

```typescript
Server Component

Props: {
  state: 'correct' | 'wrong' | 'missed' | 'neutral'
  children: React.ReactNode
}

State styles (from theming.md Answer Highlight States):
  correct: background #ECFDF5, border #10B981, text #065F46
  wrong:   background #FEF2F2, border #EF4444, text #991B1B
  missed:  background #FFFBEB, border #F59E0B, text #92400E
  neutral: background #F8FAFF, border #E2E8F0, text #1E293B

State icons:
  correct → ✓
  wrong   → ✗
  missed  → !
  neutral → —

Renders:
  - Styled container with border and background
  - Icon on left
  - Children content
  - Border radius: 8px
  - Padding: 10px 14px
```

---

## Component 11 — `src/components/shared/WordCounter.tsx`

```typescript
'use client'

Props: {
  currentCount: number
  minCount: number
  maxCount: number
}

Color states:
  Below min: color muted (grey)
  At or above min, below max: color success (green)
  At max: color error (red)

Renders:
  - Text: "{currentCount} / {maxCount} words"
  - Color changes based on state
  - Font: Inter, 0.78rem, font-weight 600
  - Used inside textarea footer bar
```

---

## Component 12 — `src/components/shared/RecordButton.tsx`

```typescript
'use client'

Props: {
  state: 'idle' | 'preparing' | 'recording' | 'processing'
  onStart?: () => void
  onStop?: () => void
  countdown?: number     — preparation countdown seconds
}

States:
  idle:
    Blue circle button with mic icon
    Label: "Click to record" (if no preparation time)

  preparing:
    Show large countdown number (30, 29, 28...)
    Label: "Prepare to speak"
    Button disabled

  recording:
    Red circle with pulsing animation
    Stop icon inside
    Animated waveform bars next to button
    Label: "Recording..."
    Timer counting down speaking time

  processing:
    Spinner animation
    Label: "Analysing your response..."
    Button disabled

Reference: Section2_Student_Portal.html
Look at record area in Reference 4 (Speaking Attempt)
```

---

## Component 13 — `src/components/shared/MCQOption.tsx`

```typescript
'use client'

Props: {
  label: string          — e.g. "A", "B"
  text: string
  selected: boolean
  disabled?: boolean     — true after submission
  resultState?: 'correct' | 'wrong' | 'missed' | 'neutral'
  multiSelect?: boolean  — checkbox vs radio
  onChange?: (label: string) => void
}

Before submission:
  Unselected: white bg, border gray, text dark
  Selected: blue pale bg, blue border, text blue
  Hover: border blue (if not disabled)

After submission (disabled=true, resultState provided):
  Use AnswerResult states for styling
  Show result icon on right
  Show result label: "✓ Correct" | "✗ Wrong" | "! Missed" | ""

Renders:
  - Circle marker (radio) or checkbox on left
  - Option label (A, B, C...) in small badge
  - Option text
  - Result label on right (after submission)
```

---

## Component 14 — `src/components/shared/EmptyState.tsx`

```typescript
Server Component

Props: {
  icon: string           — emoji
  title: string
  description?: string
  action?: React.ReactNode
}

Renders:
  - Centered layout
  - Large emoji icon
  - Title: Outfit font, slate color
  - Description: Inter, muted color
  - Action slot (optional button)
  - Used for empty question lists, no data states
```

---

## Component 15 — `src/components/shared/LoadingSpinner.tsx`

```typescript
Server Component (can be used anywhere)

Props: {
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
  label?: string
}

fullPage=true:
  Full viewport height, centered
  White background

fullPage=false (default):
  Inline spinner

Sizes:
  sm: 16px
  md: 32px (default)
  lg: 48px

Spinner: CSS border-radius animation, blue color
Label: optional text below spinner
```

---

## Component 16 — `src/components/shared/ConfirmModal.tsx`

```typescript
'use client'

Props: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string  — default "Confirm"
  isDanger?: boolean     — if true: confirm button is red
  isLoading?: boolean
}

Uses shadcn AlertDialog component.

Reference: Section3_Admin_Portal.html
Look at Reference 7 (Confirm Delete Modal)

Renders:
  - Overlay modal
  - Icon: trash/warning emoji
  - Title and description
  - Optional warning box (red bg) for irreversible actions
  - Cancel button (outline)
  - Confirm button (blue normally, red if isDanger=true)
  - Loading state on confirm button
```

---

## Component 17 — `src/components/admin/DataTable.tsx`

```typescript
'use client'

Props: {
  columns: Array<{
    key: string
    label: string
    width?: string
    render?: (value: any, row: any) => React.ReactNode
  }>
  data: any[]
  isLoading?: boolean
  emptyMessage?: string
}

Renders:
  - White card container with border and radius
  - Table header: off-white bg, uppercase labels, slate text
  - Table rows: alternating off-white on hover
  - Border between rows
  - Loading state: skeleton rows
  - Empty state: EmptyState component
  - render prop allows custom cell content (badges, buttons etc)

Reference: Section3_Admin_Portal.html
Look at all table components
```

---

## Component 18 — `src/components/admin/StatusToggle.tsx`

```typescript
'use client'

Props: {
  isActive: boolean
  onToggle: (newValue: boolean) => void
  isLoading?: boolean
}

Renders:
  - Toggle switch
  - On: green background
  - Off: muted background
  - Loading: disabled with spinner
  - Uses shadcn Switch component

Reference: Section3_Admin_Portal.html
Look at active toggle in question tables
```

---

## Component 19 — `src/components/admin/FormSection.tsx`

```typescript
Server Component

Props: {
  title: string
  children: React.ReactNode
}

Renders:
  - White card with border
  - Title: Outfit font, 0.85rem, font-weight 700, navy
  - Title with bottom border separator
  - Children: form fields below
  - Padding: 20px
  - Used to group related form fields in admin forms
```

---

## Component 20 — `src/components/shared/Breadcrumb.tsx`

```typescript
Server Component

Props: {
  items: Array<{
    label: string
    href?: string
  }>
}

Renders:
  - "Item1 → Item2 → Current"
  - Items with href: rendered as Next.js Link, slate color
  - Current item (last, no href): dark color, font-weight 500
  - Separator: → in muted color
  - Font: Inter, 0.8rem
  - Used in Topbar
```

---

## Expected Output When Done

- All 20 components created with correct TypeScript types
- Components render without errors
- All use CSS variables — no hardcoded colors
- ScoreDisplay shows correct color per score range
- TimerDisplay counts down and changes color
- MCQOption shows correct/wrong/missed states correctly
- AnswerResult uses correct highlight state colors
- AudioPlayer respects play limit
- RecordButton transitions between all states
- All components match design_reference HTML files visually

---

## Verification Steps

1. Import each component in a test page and render it
2. ScoreDisplay: test with score 85 (green), 65 (amber), 35 (red)
3. AnswerResult: test all 4 states render correctly
4. TimerDisplay: test color changes at different remaining times
5. MCQOption: test before and after submission states
6. AudioPlayer: test play limit enforcement
7. ConfirmModal: test open/close and loading state
8. DataTable: test with data, empty state, and loading state
9. No TypeScript errors in any component

---

## Notes

- All components default to Server Components unless they use
  hooks, state, or browser APIs — then add 'use client'
- Use CSS variables throughout — never hardcode hex values
- shadcn components used as building blocks inside custom components
- Components in src/components/shared/ used by both student and admin
- Components in src/components/admin/ used only by admin portal
- RecordButton manages no audio logic — pure UI state only
  (actual recording logic lives in Speaking page components)
- All components should be fully typed with TypeScript interfaces

## Next Step

→ Give Claude Code `18-public-pages.md`
