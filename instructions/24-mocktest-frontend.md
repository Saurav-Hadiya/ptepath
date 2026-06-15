# 24 — Mock Test Frontend

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/23-mocktest-frontend.md and implement exactly what is described."

---

## What to Build
Complete Mock Test frontend including:
- Mock tests home page (available templates list)
- Pre-test confirmation screen
- Full test in-progress flow (all modules in sequence)
- Real-time overall countdown timer
- Per-question handling for all 4 modules
- Result page with overall + module breakdown
- Question breakdown detail view

---

## Reference Docs
- `design_reference/Section2_Student_Portal.html` — Reference 8 (Mock Test In Progress), Reference 9 (Mock Test Result)
- `docs/md/mocktest-blueprint.md` — complete mock test logic and flows
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
- `19-speaking-frontend.md` complete (useSpeakingRecorder, useTimer)
- `20-writing-frontend.md` complete (word counter logic)
- `21-reading-frontend.md` complete (MCQ, fill blanks, reorder)
- `22-listening-frontend.md` complete (AudioPlayer, all listening components)
- Backend mock test routes working (13-mocktest-backend.md)

---

## Pages to Implement

### Page 1 — Mock Tests Home

**File:** `src/app/(student)/mock-tests/page.tsx`
**Type:** Client Component

**API Call:**
````
GET /api/mock-tests
Returns: active templates list
Fields: id, name, description, totalTime, questionRules
````

**Page Structure:**
````
PageHeader:
  title: "Mock Tests"
  subtitle: "Full-length practice tests covering all four modules."

If no active templates:
  EmptyState:
    icon: "🎯"
    title: "No mock tests available"
    description: "Your instructor has not set up any mock tests yet."

If templates available:
  Template cards grid (1 column — full width cards):

  Each template card:
    Left section:
      Template name: text-display-sm, navy
      Description: text-body-md, text-secondary
      Module tags row:
        Speaking badge (blue)
        Writing badge (purple)
        Reading badge (green)
        Listening badge (red)

    Right section:
      Stats column:
        "{totalTime} min" with clock icon
        "{totalQuestions} questions" with list icon
      "Start Test →" button: var(--action-default)

    Card: white bg, border, radius-card, shadow-card
    Hover: shadow-hover, lift effect

Clicking "Start Test →":
  Does NOT start test immediately
  Opens confirmation modal
````

---

### Pre-Test Confirmation Modal

```typescript
Component: MockTestConfirmModal.tsx

Props: {
  template: MockTestTemplate
  onConfirm: () => void
  onCancel: () => void
  isOpen: boolean
}

Uses shadcn AlertDialog.

Modal content:
  Title: "{templateName}"
  Stats grid (2x2):
    Total Questions: {n}
    Total Time: {n} minutes
    Modules: Speaking, Writing, Reading, Listening
    Retakes: Unlimited

  Rules list:
    "You cannot go back to a previous question"
    "The test auto-submits when time runs out"
    "Speaking questions have their own time limits"
    "Writing questions have their own time limits"

  Buttons:
    Cancel (outline)
    "Start Test →" (var(--action-default))

On confirm: call startMockTest API then navigate to attempt page
```

---

### Page 2 — Mock Test Attempt Page

**File:** `src/app/(student)/mock-tests/attempt/page.tsx`
**Type:** Client Component ('use client')

Reference: Section2_Student_Portal.html — Reference 8

**IMPORTANT: No sidebar on this page.**
Mock test uses full-screen layout.
Different layout from all other student pages.

Override student layout for this page.
Use a completely separate layout that is full-screen.

**State Management:**
```typescript
All test state in one useState object:

interface MockTestState {
  templateId: string
  templateName: string
  totalTime: number          — seconds
  questions: TestQuestion[]
  currentIndex: number
  answers: AnswerRecord[]
  timeRemaining: number      — seconds
  phase: 'loading' | 'active' | 'submitting' | 'complete'
}

interface TestQuestion {
  id: string
  module: 'speaking' | 'writing' | 'reading' | 'listening'
  questionType: string
  questionData: any
  speakingTime?: number
  preparationTime?: number
}

interface AnswerRecord {
  questionId: string
  questionType: string
  module: string
  answer: any | null     — null for speaking (uses score instead)
  score: number | null   — only for speaking (pre-scored)
}
```

---

**Start Test Flow:**
```typescript
On page load:
  1. Get templateId from URL params or sessionStorage
  2. POST /api/mock-tests/{templateId}/start
  3. Receive: { templateId, templateName, totalTime, questions }
  4. Initialize state with all questions + empty answers array
  5. Start overall countdown timer (totalTime × 60 seconds)
  6. Set phase to 'active'
  7. Show first question

If start API fails:
  Show error: "Could not start mock test. Please try again."
  Button: "Go Back"
```

---

**Page Layout:**
````
Full screen — no sidebar.

Top Progress Bar:
  Background: var(--brand-primary)
  Height: 56px
  Left section:
    "Mock Test" label (muted white)
    Template name (white, font-weight 600)
    Separator
    Progress: "Question {current} of {total}"
    Progress dots: filled = done, active = current, empty = remaining
  Right section:
    Overall timer: MM:SS format
      Normal: white text on navy-ish background
      Warning (< 10 min): amber text + background
      Danger (< 5 min): red text + background

Content area (below progress bar):
  Question display (left, fills available space)
  Info side panel (right, 280px) — shows progress + question info

Bottom navigation bar:
  Background: white, border-top
  Right aligned:
    "Skip question" button (outline, grey)
    "Next Question →" button (var(--action-default))
      Disabled until answer given or timer forces advance
````

---

**Question Rendering by Module:**

```typescript
Create MockTestQuestionRenderer.tsx

Props: {
  question: TestQuestion
  onAnswerReady: (answer: any, score?: number) => void
  onSpeakingScored: (score: number) => void
}

Switch on question.module:

case 'speaking':
  Render appropriate speaking component
  BUT: score immediately via Groq, do NOT wait for test end
  On score received:
    Store score in answers (not audio)
    Enable "Next Question →" button
    Call onSpeakingScored(finalScore)

case 'writing':
  Render SWT or Essay component
  Per-question timer applies (speakingTime field used as writing time)
  On submit or timer expire:
    Store responseText in answers
    Enable next

case 'reading':
  Render appropriate reading component
  No per-question timer
  On submit:
    Store answers
    Enable next

case 'listening':
  Render appropriate listening component
  No per-question timer
  On submit:
    Store answers
    Enable next
```

---

**Navigation Logic:**
```typescript
"Next Question →" behaviour:
  If currentIndex < questions.length - 1:
    currentIndex + 1
    Scroll to top
  If currentIndex === questions.length - 1:
    Show "Submit Test" instead of "Next"

"Skip question":
  Store null in answers for current question
  Advance to next question
  Skipped questions score 0

"Submit Test" button:
  Shows on last question
  On click: submit all answers to backend
  Show loading: "Submitting your test..."

Auto-advance scenarios:
  Speaking: timer expires during prep → skip question, score 0
  Speaking: timer expires during recording → submit recording to Groq → score → advance
  Writing: timer expires → auto-submit text → advance
  Overall timer reaches 0:
    Auto-submit test immediately
    Whatever answers collected so far
    Show: "Time's up! Your test has been submitted."
```

---

**Overall Timer:**
```typescript
useEffect:
  setInterval every 1 second: timeRemaining - 1
  On timeRemaining = 0: trigger auto-submit
  Clear interval on unmount

Timer display format: MM:SS
  e.g. 01:14:22 shown as "1:14:22" or "74:22"
  Use HH:MM:SS if > 60 minutes, MM:SS otherwise

Color changes:
  > 10 minutes: white text, transparent bg
  5-10 minutes: var(--feedback-warning) text + pale bg
  < 5 minutes:  var(--feedback-error) text + pale bg
```

---

**Submit Test:**
```typescript
POST /api/mock-tests/{templateId}/submit

Build request body:
{
  timeTaken: Math.floor((totalTime * 60 - timeRemaining) / 60),
  answers: answers.map(a => ({
    questionId: a.questionId,
    questionType: a.questionType,
    module: a.module,
    answer: a.answer,    — null for speaking
    score: a.score       — null for non-speaking
  }))
}

On success:
  Store result in sessionStorage (for result page)
  Navigate to /mock-tests/result

On error:
  Show error toast
  Allow retry
```

---

### Page 3 — Mock Test Result Page

**File:** `src/app/(student)/mock-tests/result/page.tsx`
**Type:** Client Component ('use client')

Reference: Section2_Student_Portal.html — Reference 9

Get result from sessionStorage or re-fetch if missing.

**Page Layout:**
````
Standard student layout (sidebar visible again)

Overall score hero card:
  Background: gradient var(--brand-primary) to darker
  Text: white
  Center aligned:
    Label: "Overall Score"
    Large score number: text-score-xl
    "/90" in muted white
    Score colored: green/amber/red per score logic
  Meta row below score:
    Questions answered: {n} / {total}
    Time taken: {n} minutes
    Modules: 4

Module breakdown section:
  Label: "Module Breakdown"
  4 module cards in a row:

  Each module card:
    Module name (small, uppercase, muted)
    Score number: text-score-lg, colored green/amber/red
    "/90" small
    Thin colored bar: width = score%, color = green/amber/red
    Background: white, border, radius-card

Action buttons:
  "View Question Breakdown" (outline)
  "Try Again →" (var(--brand-primary))

"View Question Breakdown" expands below:
  Grouped by module (Speaking, Writing, Reading, Listening)
  Each group has a header with module name + module score
  Each question row:
    Question number
    Question type badge
    Score: colored
    "View Details" button

"View Details" opens a modal:
  Question content
  Student's answer
  Correct answer
  Score breakdown
  (Reuse ScoreBreakdownCard component)
````

---

**Result Data Structure:**
```typescript
interface MockTestResult {
  overallScore: number
  displayScore: string
  timeTaken: number
  questionsAnswered: number
  modules: {
    speaking: ModuleResult
    writing: ModuleResult
    reading: ModuleResult
    listening: ModuleResult
  }
}

interface ModuleResult {
  score: number
  displayScore: string
  questions: QuestionResult[]
}

interface QuestionResult {
  questionId: string
  questionType: string
  score: number
  displayScore: string
  breakdown: any
}
```

---

**Try Again Flow:**
```typescript
"Try Again →" button:
  Navigate back to /mock-tests
  Student selects same or different template
  New random questions generated each time
  Previous result discarded
```

---

### Mock Test Specific Hooks

**`useMockTestTimer.ts`**
```typescript
Hook that manages overall countdown timer.

Props: {
  totalSeconds: number
  onExpire: () => void
}

Returns: {
  timeRemaining: number
  formattedTime: string   — "MM:SS" or "H:MM:SS"
  warningLevel: 'none' | 'warning' | 'danger'
  start: () => void
  pause: () => void
}

warningLevel:
  timeRemaining > 600 (10 min): 'none'
  timeRemaining 300-600 (5-10 min): 'warning'
  timeRemaining < 300 (< 5 min): 'danger'
```

---

**`useMockTestState.ts`**
```typescript
Custom hook managing entire mock test state.

Encapsulates:
  questions array
  currentIndex
  answers array
  timeRemaining
  phase

Functions:
  setAnswer(index, answer, score?): update answer for question
  nextQuestion(): advance currentIndex
  skipQuestion(): store null answer, advance
  isLastQuestion(): boolean
  getCurrentQuestion(): TestQuestion
  getAnswerForCurrent(): AnswerRecord

Returns all state + functions.
Keeps attempt page component clean.
```

---

### Session Storage Usage

```typescript
Before navigating to attempt page:
  sessionStorage.setItem('mocktest_template_id', templateId)

After test completes:
  sessionStorage.setItem('mocktest_result', JSON.stringify(result))
  sessionStorage.removeItem('mocktest_template_id')

On result page load:
  result = JSON.parse(sessionStorage.getItem('mocktest_result'))
  If no result: show "No result found" + "Go to Mock Tests" button

On leaving result page:
  sessionStorage.removeItem('mocktest_result')
```

---

### Page Guards

Mock test attempt page:
```typescript
If user navigates away mid-test:
  Show browser confirmation: "Are you sure? Your test progress will be lost."
  Use beforeunload event listener
  Clean up on unmount
```

Result page:
```typescript
If no result in sessionStorage:
  Do not crash — show friendly message
  "No test result found. Please take a mock test first."
  Button: "Go to Mock Tests"
```

---

## TanStack Query Setup

```typescript
Fetch templates:
const { data, isLoading } = useQuery({
  queryKey: ['mock-test-templates'],
  queryFn: () => api.get('/mock-tests').then(r => r.data.data.templates)
})

Start test:
const startMutation = useMutation({
  mutationFn: (templateId) =>
    api.post(`/mock-tests/${templateId}/start`).then(r => r.data.data),
  onSuccess: (data) => {
    initializeMockTest(data)
    router.push('/mock-tests/attempt')
  }
})

Submit test:
const submitMutation = useMutation({
  mutationFn: ({ templateId, payload }) =>
    api.post(`/mock-tests/${templateId}/submit`, payload).then(r => r.data.data),
  onSuccess: (result) => {
    sessionStorage.setItem('mocktest_result', JSON.stringify(result))
    router.push('/mock-tests/result')
  }
})
```

---

## Page Flow Summary

````
/mock-tests
  → Template cards listed
  → Student clicks "Start Test →"
  → Confirmation modal opens
  → Student clicks "Start Test" in modal

/mock-tests/attempt
  → Questions loaded from backend
  → Overall timer starts
  → Question 1 shown (Speaking: Read Aloud)
  → Student records → Groq scores → Next
  → Question 2 (Speaking: Repeat Sentence)
  → ... through all speaking questions
  → Writing questions (with per-question timers)
  → Reading questions (no timer)
  → Listening questions (no timer)
  → Last question → "Submit Test" button
  → Submit → navigate to result

/mock-tests/result
  → Overall score displayed
  → Module breakdown shown
  → View Question Breakdown expandable
  → Try Again → back to /mock-tests
````

---

## Expected Output When Done
- Mock tests home shows available templates
- Confirmation modal shows test rules before starting
- Full-screen attempt page (no sidebar)
- Overall timer visible and counting down
- Progress dots show question completion
- Speaking questions score during test via Groq
- Writing questions have per-question timers
- Reading and Listening have no per-question timers
- Auto-submit on overall timer expiry
- Result page shows overall + 4 module scores
- Question breakdown expandable with correct answers
- Try Again navigates back to template selection

---

## Verification Steps
1. Visit /mock-tests → templates listed
2. Click "Start Test" → confirmation modal with rules
3. Confirm → test loads, progress bar shows Q1 of N
4. Overall timer counts down from total time
5. Speaking question: record → Groq scores → Next enabled
6. Writing question: type → submit → Next enabled
7. Reading question: answer → submit → Next enabled
8. Listening question: listen → answer → submit → Next enabled
9. Last question → "Submit Test" shown → submit → result page
10. Result page: overall score + 4 module scores + breakdown
11. "View Question Breakdown" expands correctly
12. "Try Again" → back to /mock-tests
13. Timer warning: amber at 10 min, red at 5 min
14. Overall timer expiry: auto-submits whatever collected

---

## Notes
- No sidebar on attempt page — full screen layout
- Speaking scored DURING test via Groq — not at submit
- All other modules scored server-side on submit
- sessionStorage used for template ID and result (not localStorage)
- Before unload warning prevents accidental test abandonment
- Skipped questions score 0 automatically
- Module order fixed: speaking → writing → reading → listening
- Questions loaded ALL at once at start — no mid-test API calls
  (except speaking Groq scoring)
- Overall score = average of 4 module averages (equal weight)
- displayScore uses Math.round(score × 0.90) + " / 90" throughout

## Next Step
→ Give Claude Code `25-admin-portal.md`
