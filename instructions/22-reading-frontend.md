# 21 — Reading Frontend

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/21-reading-frontend.md and implement exactly what is described."

---

## What to Build
Complete Reading module frontend including:
- Module home page (5 question type cards)
- Question list page
- Attempt pages for all 5 question types
- Drag and drop for Fill Blanks and Reorder Paragraphs
- MCQ with single and multiple selection
- Score display with correct answer reveal

---

## Reference Docs
- `design_reference/Section2_Student_Portal.html` — Reference 2, 3, 6 (Reading Attempt)
- `docs/md/reading-module.md` — complete reading module logic
- `docs/md/theming.md` — CSS variables and typography tokens

---

## Important — CSS Variable and Typography Convention
Use semantic CSS variable names. Never hardcode hex values.
Use typography token classes. Never hardcode font sizes.
Reference: docs/md/theming.md for all names.

---

## Prerequisites
- `15-frontend-foundation.md` complete
- `16-shared-components.md` complete
- `18-student-dashboard.md` complete
- Backend reading routes working (11-reading-backend.md)
- @dnd-kit/core and @dnd-kit/sortable installed

---

## Pages to Implement

### Page 1 — Reading Module Home

**File:** `src/app/(student)/reading/page.tsx`
**Type:** Client Component

Reference: Section2_Student_Portal.html — Reference 2

**API Call:**
````
GET /api/reading/questions/counts
New backend route needed.

Backend: count active reading questions per type
Returns:
{
  rw_fill_blanks: number,
  mcq_multiple: number,
  reorder_paragraphs: number,
  reading_fill_blanks: number,
  mcq_single: number
}

Add to reading routes:
GET /api/reading/questions/counts → authenticate, getReadingCounts
````

**Page Structure:**
````
Module header card:
  Reading icon (📖) in green pale circle
  Title: "Reading Module"
  Subtitle: "5 question types · Select a type to view all questions"
  Green top border (var(--module-reading))

5 question type cards in 3-column grid (2+2+1):

Card 1: R&W Fill in the Blanks
  Description: "Drag words from the pool into the correct blank spaces in the passage."
  Details: "Partial credit per blank"

Card 2: MCQ Multiple Answers
  Description: "Select ALL correct answers. More than one option may be correct."
  Details: "Negative marking applies"

Card 3: Re-order Paragraphs
  Description: "Drag paragraph boxes into the correct logical order."
  Details: "Pair-based scoring"

Card 4: Reading Fill in the Blanks
  Description: "Select the correct word from a dropdown for each blank in the passage."
  Details: "Partial credit per blank"

Card 5: MCQ Single Answer
  Description: "Read the passage and select ONE correct answer."
  Details: "Binary scoring"

Type slug mapping:
  rw_fill_blanks         → /reading/rw-fill-blanks
  mcq_multiple           → /reading/mcq-multiple
  reorder_paragraphs     → /reading/reorder-paragraphs
  reading_fill_blanks    → /reading/reading-fill-blanks
  mcq_single             → /reading/mcq-single
````

---

### Page 2 — Question List Page

**File:** `src/app/(student)/reading/[type]/page.tsx`
**Type:** Client Component

Same layout as Writing and Speaking question lists.

**Type slug to API type mapping:**
````
rw-fill-blanks          → rw_fill_blanks
mcq-multiple            → mcq_multiple
reorder-paragraphs      → reorder_paragraphs
reading-fill-blanks     → reading_fill_blanks
mcq-single              → mcq_single
````

**API Call:**
````
GET /api/reading/questions?type={questionType}
Returns: list of active questions
Fields: id, type, passage (first 80 chars)
````

**Question preview text:**
````
rw_fill_blanks:       passage preview (first 80 chars)
mcq_multiple:         passage preview
reorder_paragraphs:   "Reorder {n} paragraphs"
reading_fill_blanks:  passage preview
mcq_single:           passage preview
````

---

### Page 3 — Reading Attempt Page

**File:** `src/app/(student)/reading/[type]/[id]/page.tsx`
**Type:** Client Component ('use client')

Reference: Section2_Student_Portal.html — Reference 6

One page handles all 5 question types.
Detects type from URL, renders correct question component.

**API Call:**
````
GET /api/reading/{type}/{id}
Returns question without correct answers
````

**Page Layout:**
````
Breadcrumb: Reading → {Type Name} → Question {n}

Two-column layout:
  Left (flex-1): Question content
  Right (280px): Info panel + Score panel

No timer for reading questions in practice mode.
(Timer applies only in mock test)

Info panel:
  Type: {question type name}
  Module: Reading
  Scoring: scoring method description
    rw_fill_blanks:      "1 point per correct blank"
    mcq_multiple:        "+1 / −1 per option"
    reorder_paragraphs:  "Pair-based scoring"
    reading_fill_blanks: "1 point per correct blank"
    mcq_single:          "Binary — correct or wrong"
````

---

### Question Type Components

Create in `src/components/reading/`:

---

**`RWFillBlanksQuestion.tsx`** — Drag and Drop

```typescript
Props: { question: ReadingQuestion, onScoreReceived: (score) => void }

State:
  wordPool: string[]     — words not yet placed
  blanks: Record<number, string>   — blank index → placed word
  submitted: boolean

Uses @dnd-kit/core for drag and drop.

Renders:

Instruction:
  "Drag words from the box below into the correct blank spaces."

Passage with drop zones:
  Parse passage text — replace each blank marker with a drop zone
  Drop zone: dashed border box, shows word when filled, empty hint when not
  Filled drop zone: blue pale background, blue text, draggable back out
  Empty drop zone: dashed border, grey, label "Drop here"

Word pool below passage:
  All available words as draggable chips
  Each chip: white bg, border, dark text, cursor grab
  Used words: hidden from pool (moved to blank)
  If word dragged back from blank: returns to pool

Drag behaviour:
  Word dragged from pool → dropped on blank:
    Remove from wordPool
    Add to blanks[blankIndex]
  Word dragged from blank → dropped on pool or outside:
    Remove from blanks
    Return to wordPool
  Word from one blank → dropped on another blank:
    Swap the two words

Submit button:
  Enabled always (partial submission allowed)
  Text: "Submit Answers"

On submit:
  answers = blanks as ordered array
  POST /api/reading/evaluate with { questionId, questionType: 'rw_fill_blanks', answers }

After score:
  Show result per blank:
    Correct: green background, ✓ icon
    Wrong: red background, ✗ icon + correct answer shown
  Word pool hidden
  Passage blanks locked
```

---

**`MCQMultipleQuestion.tsx`** — Multiple Selection

```typescript
Props: { question: ReadingQuestion, onScoreReceived: (score) => void }

State:
  selectedLabels: string[]
  submitted: boolean
  results: OptionResult[] | null

Renders:

Instruction:
  "Read the passage. Select ALL correct answers.
   More than one option may be correct. Negative marking applies."

Passage in scrollable box (max-height 180px)

Question text below passage

Options as checkbox list:
  MCQOption component (multiSelect=true)
  Each option: checkbox + label letter + option text
  Student can check/uncheck freely before submission

Negative marking warning (amber info box):
  "⚠ Selecting a wrong option deducts points.
   Only select options you are confident about."

Submit button:
  Enabled when at least 1 option selected
  Text: "Submit Answers"

On submit:
  POST /api/reading/evaluate with { questionId, questionType: 'mcq_multiple', answers: selectedLabels }

After score (submitted=true):
  Each option shows result state via MCQOption (resultState prop):
    correct_selected → 'correct'
    wrong_selected   → 'wrong'
    missed           → 'missed'
    neutral          → 'neutral'
  Options disabled (no further selection)
```

---

**`ReorderParagraphsQuestion.tsx`** — Drag to Reorder

```typescript
Props: { question: ReadingQuestion, onScoreReceived: (score) => void }

State:
  sourcePool: Paragraph[]    — paragraphs not yet placed
  answerSequence: Paragraph[] — paragraphs placed in order
  submitted: boolean

Uses @dnd-kit/sortable for reordering in answer panel.

Renders:

Instruction:
  "Drag the paragraph boxes from the left panel into the
   correct order in the right panel."

Two-panel layout side by side:

Left panel — "Source":
  Header: "Source — Drag from here"
  Background: slightly different shade
  Remaining paragraph boxes (not yet placed)
  Each box: drag handle icon + first 60 chars of text
  Cursor: grab
  On drag: paragraph moves to answer panel

Right panel — "Answer":
  Header: "Answer — Drop here in order"
  Background: white with dashed border when empty
  Placed paragraphs in student's chosen order
  Can reorder within this panel by dragging
  Drop zone placeholder shown when empty
  Each placed box: drag handle + paragraph preview

Submit button:
  Below both panels
  Enabled when at least 1 paragraph in answer panel
  Text: "Submit Order"

On submit:
  answers = answerSequence.map(p => p.label)
  POST /api/reading/evaluate with { questionId, questionType: 'reorder_paragraphs', answers }

After score:
  Show student's order vs correct order side by side:
    Student order column: each paragraph with ✓ or ✗
    Correct order column: correct sequence
  Score: "{correctPairs} / {totalPairs} pairs correct"
```

---

**`ReadingFillBlanksQuestion.tsx`** — Dropdown Selection

```typescript
Props: { question: ReadingQuestion, onScoreReceived: (score) => void }

State:
  selections: Record<number, string>  — blank index → selected word
  submitted: boolean

Renders:

Instruction:
  "Read the passage. Select the correct word from each dropdown."

Passage with inline dropdowns:
  Parse passage — replace blank markers with <select> elements
  Each dropdown: shows all options for that blank
  Default: "Select..." placeholder
  Selected: show chosen word
  After submission: disabled

Submit button:
  Enabled when all blanks have selections
  Text: "Submit Answers"

On submit:
  answers = selections as ordered array
  POST /api/reading/evaluate with { questionId, questionType: 'reading_fill_blanks', answers }

After score:
  Each blank shows:
    Correct: green background select, ✓
    Wrong: red background select, ✗ + correct word shown
```

---

**`MCQSingleQuestion.tsx`** — Single Selection

```typescript
Props: { question: ReadingQuestion, onScoreReceived: (score) => void }

State:
  selectedLabel: string | null
  submitted: boolean

Renders:

Instruction:
  "Read the passage. Select ONE correct answer."

Passage in scrollable box

Question text

Options as radio button list:
  MCQOption component (multiSelect=false)
  Only one selectable at a time

Submit button:
  Enabled when option selected
  Text: "Submit Answer"

On submit:
  POST /api/reading/evaluate with { questionId, questionType: 'mcq_single', answer: selectedLabel }

After score:
  Each option shows result:
    Correct option: green (whether selected or not)
    Wrong selected: red
    Others: neutral
```

---

### Score Display — Reading Specific

```typescript
Score response from backend contains full breakdown.
Show ScoreBreakdownCard in right panel.

Bars vary by type:

rw_fill_blanks / reading_fill_blanks:
  Single bar: "Accuracy" = finalScore

mcq_multiple:
  Single bar: "Accuracy" = finalScore
  Show additional info: "{totalPoints} points from {numberOfCorrect} correct options"

reorder_paragraphs:
  Single bar: "Order Accuracy" = finalScore
  Show: "{correctPairs} / {totalPairs} pairs in correct order"

mcq_single:
  No bars needed — binary result
  Just show score (90/90 or 0/90) with large ScoreDisplay

All types:
  Show feedback message
  onNext: back to question list
```

---

### Submit Reading Answer

Create `src/lib/reading-api.ts`

```typescript
submitReading(questionId, questionType, answers):
  POST /api/reading/evaluate
  Body: { questionId, questionType, answers }
  Returns full score result with correct answers

Use useMutation from TanStack Query.
```

---

### TanStack Query Setup

```typescript
Fetch question:
const { data: question, isLoading } = useQuery({
  queryKey: ['reading-question', type, id],
  queryFn: () => api.get(`/reading/${type}/${id}`).then(r => r.data.data)
})

Submit:
const submitMutation = useMutation({
  mutationFn: (payload) => submitReading(payload.questionId, payload.questionType, payload.answers),
  onSuccess: (data) => {
    setResults(data)
    setSubmitted(true)
  }
})
```

---

## Page Flow Summary

````
/reading
  → 5 question type cards

/reading/rw-fill-blanks
  → List of all R&W Fill Blank questions

/reading/rw-fill-blanks/[id]
  → Passage with drop zones + word pool
  → Student drags words into blanks
  → Submit → correct/wrong per blank shown

/reading/mcq-multiple/[id]
  → Passage + question + checkboxes
  → Student selects all correct
  → Submit → correct/wrong/missed shown

/reading/reorder-paragraphs/[id]
  → Source panel + answer panel
  → Student drags into order
  → Submit → pair-based score + correct order shown

/reading/reading-fill-blanks/[id]
  → Passage with dropdowns
  → Student selects per dropdown
  → Submit → correct/wrong per blank shown

/reading/mcq-single/[id]
  → Passage + question + radio buttons
  → Student selects one
  → Submit → correct answer highlighted
````

---

## Drag and Drop Implementation Notes

### For R&W Fill Blanks (pool → blanks):
```typescript
Use @dnd-kit/core:
  DndContext wrapping entire question
  Draggable: each word in pool
  Droppable: each blank position in passage

On drag end:
  if dropped on blank: move word from pool to blank
  if dropped outside: return to pool
```

### For Reorder Paragraphs (sort within panel):
```typescript
Use @dnd-kit/sortable:
  SortableContext wrapping answer panel
  Each paragraph box is a SortableItem
  verticalListSortingStrategy

Also:
  Droppable source panel
  Draggable items in source panel
  On drop to answer panel: move from source to answer
  On sort within answer: reorder answerSequence
```

---

## Mobile Considerations

````
Drag and drop on mobile:
  @dnd-kit works with touch events — no extra config
  Word pool chips: min height 40px for touch
  Blank drop zones: min height 40px

Reorder panels on mobile:
  Stack vertically (source on top, answer below)
  Wider paragraph boxes on mobile

MCQ options: min height 44px per option for touch
Submit button: full width on mobile
````

---

## Expected Output When Done
- Reading module home shows 5 type cards with correct descriptions
- Question list works for all 5 types
- R&W Fill Blanks: drag and drop works correctly
- MCQ Multiple: checkboxes work, negative marking warning shown
- Reorder: two-panel drag and drop works
- Reading Fill Blanks: inline dropdowns work
- MCQ Single: radio buttons work
- All types: correct answers revealed after submission
- Answer state highlights correct/wrong/missed correctly
- No timer in practice mode (correct per platform decision)

---

## Verification Steps
1. Visit /reading → 5 cards with descriptions and scoring notes
2. R&W Fill Blanks: drag word into blank → blank fills → drag back → returns to pool
3. R&W Fill Blanks submit: correct blank green, wrong blank red with correct answer
4. MCQ Multiple: check 2 options → submit → correct/wrong/missed states shown
5. Reorder: drag all to answer panel → reorder → submit → score + correct order shown
6. Reading Fill Blanks: select from dropdown → submit → result shown
7. MCQ Single: select one → submit → correct answer highlighted
8. Negative marking warning visible on MCQ Multiple page
9. Mobile: touch drag works on @dnd-kit components
10. No timer visible on any reading attempt page

---

## Notes
- No timer on reading pages in practice mode
- @dnd-kit handles both mouse and touch events
- Correct answers come from API response — never sent before submission
- Reorder paragraphs: paragraphs shuffled by backend before sending
- MCQ options: isCorrect field stripped by backend before sending
- All reading types use same evaluate endpoint with questionType field
- MCQOption component from shared components used for both MCQ types
- multiSelect prop on MCQOption controls checkbox vs radio behaviour

## Next Step
→ Give Claude Code `23-listening-frontend.md`
