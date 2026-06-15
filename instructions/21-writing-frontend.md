# 20 — Writing Frontend

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/20-writing-frontend.md and implement exactly what is described."

---

## What to Build
Complete Writing module frontend including:
- Module home page (2 question type cards)
- Question list page
- Attempt pages for both question types
- Live word counter with color states
- Timed textarea with auto-submit
- Score display with misspelled words

---

## Reference Docs
- `design_reference/Section2_Student_Portal.html` — Reference 2 (Module Home), Reference 3 (Question List), Reference 5 (Writing Attempt)
- `docs/md/writing-module.md` — complete writing module logic
- `docs/md/theming.md` — CSS variables and typography tokens

---

## Important — CSS Variable and Typography Convention
Use semantic CSS variable names. Never hardcode hex values.
Use typography token classes. Never hardcode font sizes directly.
Reference: docs/md/theming.md for all names.

---

## Prerequisites
- `15-frontend-foundation.md` complete
- `16-shared-components.md` complete
- `18-student-dashboard.md` complete
- Backend writing routes working (10-writing-backend.md)

---

## Pages to Implement

### Page 1 — Writing Module Home

**File:** `src/app/(student)/writing/page.tsx`
**Type:** Client Component

Reference: Section2_Student_Portal.html — Reference 2
(Same layout as Speaking module home — 2 cards instead of 5)

**API Call:**
````
GET /api/writing/questions/counts
New backend route needed.

Backend: count active writing questions per type
Returns:
{
  summarise_written_text: number,
  write_essay: number
}

Add to writing routes:
GET /api/writing/questions/counts → authenticate, getWritingCounts
````

**Page Structure:**
````
Module header card:
  Writing icon (✍️) in purple pale circle
  Title: "Writing Module"
  Subtitle: "2 question types · Select a type to view all questions"
  Purple top border (var(--module-writing))

2 question type cards in 2-column grid:

Card 1: Summarise Written Text
  Number badge: 1
  Name: "Summarise Written Text"
  Description: "Read a passage and write ONE sentence summarising the main idea. Use 5 to 75 words."
  Details: "⏱ 10 minutes per question"
  Question count badge
  "View questions →"

Card 2: Write Essay
  Number badge: 2
  Name: "Write Essay"
  Description: "Read an essay prompt and write a well-structured essay in 200 to 300 words."
  Details: "⏱ 20 minutes per question"
  Question count badge
  "View questions →"

Type slug mapping:
  summarise_written_text → /writing/summarise-written-text
  write_essay            → /writing/write-essay
````

---

### Page 2 — Question List Page

**File:** `src/app/(student)/writing/[type]/page.tsx`
**Type:** Client Component

Reference: Section2_Student_Portal.html — Reference 3
(Same layout as Speaking question list)

**Type slug to API type mapping:**
````
summarise-written-text → summarise_written_text
write-essay            → write_essay
````

**API Call:**
````
GET /api/writing/questions?type={questionType}
Returns: list of active questions
Fields: id, type, content (first 80 chars), timeLimit, wordMin, wordMax
````

**Page Structure:**
````
Breadcrumb: Writing → {Type Name}

Page header:
  Title: {Type Name}
  Subtitle: type description + word limit info
  Right: question count badge

Question list:
  Each item:
    Index number in grey box
    Preview: first 80 chars of content + "..."
    Subtext: time limit + word range
      SWT: "10 minutes · 5–75 words"
      Essay: "20 minutes · 200–300 words"
    "Attempt →" button
    Clicking → /writing/{type}/{id}
````

---

### Page 3 — Summarise Written Text Attempt Page

**File:** `src/app/(student)/writing/[type]/[id]/page.tsx`
**Type:** Client Component

Reference: Section2_Student_Portal.html — Reference 5

This one page handles both writing question types.
Detects type from URL params and renders correct component.

**API Call to fetch question:**
````
GET /api/writing/{type}/{id}
Returns: { id, type, content, timeLimit, wordMin, wordMax }
````

---

**Page Layout:**
````
Breadcrumb: Writing → {Type Name} → Question {n}

Two-column layout:
  Left (flex-1): Question content + writing area
  Right (280px): Info panel + Score panel

Left:
  QuestionTypeBadge
  Instruction text
  Passage/prompt display area (scrollable, read-only)
  Writing area (textarea + word counter bar)

Right (top):
  Info panel:
    TimerDisplay (counting down)
    Info rows: Type, Time limit, Word range

Right (bottom — after submission):
  ScoreBreakdownCard
````

---

### Summarise Written Text Component

Create `src/components/writing/SummariseWrittenTextQuestion.tsx`

```typescript
Props: {
  question: WritingQuestion
  onScoreReceived: (score) => void
}

State:
  responseText: string
  wordCount: number
  phase: 'writing' | 'processing' | 'scored'
  score: ScoreResult | null

Layout:

Instruction:
  "Read the passage below. Write ONE sentence summarising
   the main idea. Use 5 to 75 words."

Passage display box:
  Read-only
  Max height: 180px with scroll
  Background: var(--bg-page)
  Border: var(--border-default)
  Font: text-body-md, text-primary
  Line height: 1.8

Writing area:
  Label: "Your Response"
  Textarea:
    Min height: 120px
    Font: text-body-md, text-primary
    Border: var(--border-default)
    Focus border: var(--action-default)
    onChange: update responseText + count words + enforce max words
    Disabled when phase = 'processing' or 'scored'

  Word counter bar (below textarea):
    Left: WordCounter component showing "{count} / 75 words"
    Middle: progress bar (0-75 words)
    Right: Submit button

Word enforcement rule:
  On every onChange: count words
  If wordCount >= 75: trim input to last valid word boundary
  Student cannot type beyond 75 words

Submit button states:
  wordCount < 5: disabled, grey
  wordCount 5-75: enabled, var(--action-default)
  phase processing: disabled, loading spinner
  phase scored: hidden

Timer (useTimer hook):
  initialSeconds: question.timeLimit (600 = 10 minutes)
  onExpire: auto-submit if wordCount >= 5
  If wordCount < 5 on expiry: submit anyway (will score as 0)
```

---

### Write Essay Component

Create `src/components/writing/WriteEssayQuestion.tsx`

```typescript
Props: {
  question: WritingQuestion
  onScoreReceived: (score) => void
}

Almost identical to SummariseWrittenTextQuestion with these differences:

Instruction:
  "Read the prompt below. Write a well-structured essay
   in 200 to 300 words."

Prompt display box:
  Same styling but shows essay prompt (usually shorter)

Writing area:
  Larger textarea: min height 220px
  Word limit: 300 words maximum
  Enforce: block at 300 words

WordCounter color states:
  0-99 words:   var(--text-muted)    — grey
  100-199 words: var(--feedback-warning) — amber (getting closer)
  200-300 words: var(--feedback-success) — green (in range)
  At 300 words: var(--feedback-error)    — red (at limit)

Submit button:
  Disabled if wordCount < 100 (allow partial attempt)
  Enabled from 100+ words

Timer:
  initialSeconds: question.timeLimit (1200 = 20 minutes)
  onExpire: auto-submit if wordCount >= 100

Progress bar (below textarea):
  Width fills from 0 to 100% as student approaches 300 words
  Color changes with word count state
```

---

### Word Counting Function

Create `src/lib/word-counter.ts`

```typescript
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

export function enforceWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ')
}
```

---

### Submit Writing Response

Create `src/lib/writing-api.ts`

```typescript
submitSummarise(questionId: string, responseText: string):
  POST /api/writing/evaluate/summarise
  Body: { questionId, responseText }
  Returns score object

submitEssay(questionId: string, responseText: string):
  POST /api/writing/evaluate/essay
  Body: { questionId, responseText }
  Returns score object
```

---

### Score Display — Writing Specific

After submission, show ScoreBreakdownCard in right panel.

```typescript
Bars for both question types:
  [
    { label: 'Word Count', score: wordCountScore },
    { label: 'Spelling',   score: spellingScore }
  ]

Additional section below feedback:
  If misspelledWords.length > 0:
    Show "Spelling errors found:" label
    Show each misspelled word in red pill badge:
      "goverment" "enviromental" "occured"
    If more than 5: show "goverment, enviromental... +3 more"
    Hint text: "Check your spelling of these words."

ScoreBreakdownCard props:
  title: "Your Score"
  displayScore: score.displayScore
  finalScore: score.finalScore
  bars: word count + spelling bars
  feedback: score.feedback
  onNext: () => router.push('/writing/{type}')
  nextLabel: "Try Another Question →"
```

---

### Auto-Submit Behaviour

```typescript
When timer expires:
  If wordCount >= minimum (5 for SWT, 100 for Essay):
    setPhase('processing')
    Show toast: "Time is up — submitting your response..."
    Call submit function with current responseText
  If wordCount < minimum:
    setPhase('processing')
    Show toast: "Time is up — your response has been submitted."
    Call submit function anyway (will get low word count score)
```

---

### Info Panel Content

```typescript
Summarise Written Text info panel:
  Type: "Summarise Written Text"
  Time limit: "10 minutes"
  Word range: "5 – 75 words"
  Sentences: "Exactly one sentence"

Write Essay info panel:
  Type: "Write Essay"
  Time limit: "20 minutes"
  Word range: "200 – 300 words"
  Target: "Well-structured essay"
```

---

### TanStack Query Setup

```typescript
Fetch question:
const { data: question, isLoading } = useQuery({
  queryKey: ['writing-question', type, id],
  queryFn: () => api.get(`/writing/${type}/${id}`).then(r => r.data.data)
})

Submit response:
const submitMutation = useMutation({
  mutationFn: ({ questionId, responseText }) =>
    type === 'summarise_written_text'
      ? submitSummarise(questionId, responseText)
      : submitEssay(questionId, responseText),
  onSuccess: (data) => {
    setScore(data)
    setPhase('scored')
  },
  onError: () => {
    setPhase('writing')
    show error toast
  }
})
```

---

## Page Flow Summary

````
/writing
  → 2 question type cards

/writing/summarise-written-text
  → List of all SWT questions

/writing/summarise-written-text/[id]
  → Passage shown, textarea available
  → 10-minute timer counting down
  → Student writes, word counter updates
  → Submit (manual or auto on timer expiry)
  → Score + misspelled words shown

/writing/write-essay
  → List of all essay questions

/writing/write-essay/[id]
  → Essay prompt shown, large textarea
  → 20-minute timer counting down
  → Word counter turns green at 200+
  → Submit (manual or auto)
  → Score + misspelled words shown
````

---

## Mobile Considerations

````
On mobile (< 768px):
  Two-column layout → single column (stacked)
  Info panel + timer moves below writing area
  Textarea: min height 160px (enough for mobile keyboard)
  Word counter bar stays sticky at bottom of textarea
  Submit button: full width on mobile
  Timer: stays visible at top even when scrolled (sticky)
````

---

## Expected Output When Done
- Writing module home shows 2 type cards with correct descriptions
- Question list shows all questions with attempt buttons
- SWT: passage shown, textarea limited to 75 words
- Essay: prompt shown, textarea limited to 300 words
- Word counter updates live, colors change correctly
- Timer counts down, auto-submits on expiry
- Score shown with word count + spelling bars
- Misspelled words displayed as red badges after scoring
- Submit disabled below minimum word threshold
- Mobile layout works correctly

---

## Verification Steps
1. Visit /writing → 2 type cards with correct details
2. Click "Summarise Written Text" → question list loads
3. Click "Attempt" → passage shown, textarea ready
4. Type more than 75 words → blocked at 75 words
5. Word counter: grey at 3 words, green at 20 words
6. Submit with 10 words → word count score 100%, spelling scored
7. Response with misspelled words → badges shown
8. Let timer expire → auto-submits, shows score
9. Essay: word counter turns amber at 150 words, green at 220
10. Mobile view: single column, word counter visible

---

## Notes
- Both question types use the same page file — type detected from URL
- Word enforcement happens on frontend onChange — backend is safety net only
- Auto-submit sends whatever text exists — even if too short
- responseText never stored anywhere — only used for scoring
- Misspelled words come from API response — not detected on frontend
- Timer uses useTimer hook from speaking module (reuse it)
- WordCounter component from shared components used here
- useTimer imported from src/hooks/useTimer.ts (created in speaking)

## Next Step
→ Give Claude Code `22-reading-frontend.md`
