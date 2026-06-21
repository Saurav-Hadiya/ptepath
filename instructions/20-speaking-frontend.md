# 20 — Speaking Frontend

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/20-speaking-frontend.md and implement exactly what is described."

---

## What to Build
Complete Speaking module frontend including:
- Module home page (5 question type cards)
- Question list page (all questions of selected type)
- Attempt pages for all 5 question types
- Audio recording with MediaRecorder API
- TTS playback for Repeat Sentence and Answer Short Question
- Score display after submission

---

## Reference Docs
- `design_reference/Section2_Student_Portal.html` — Reference 2 (Module Home), Reference 3 (Question List), Reference 4 (Speaking Attempt)
- `docs/md/speaking-module.md` — complete speaking module logic
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
- `17-public-pages.md` complete
- `18-student-dashboard.md` complete
- Backend speaking routes working (09-speaking-backend.md)

---

## Pages to Implement

### Page 1 — Speaking Module Home

**File:** `src/app/(student)/speaking/page.tsx`
**Type:** Client Component

Reference: Section2_Student_Portal.html — Reference 2

**API Call:**
````
GET /api/speaking/questions/counts
New backend route needed.

Backend: count active questions per speaking type
Returns:
{
  read_aloud: number,
  repeat_sentence: number,
  describe_image: number,
  respond_situation: number,
  answer_short: number
}

Add to speaking routes:
GET /api/speaking/questions/counts → authenticate, getSpeakingCounts
````

**Page Structure:**
````
Module header card:
  Speaking icon (🎤) in blue pale circle
  Title: "Speaking Module"
  Subtitle: "5 question types · Select a type to view all questions"
  Blue top border on card

5 question type cards in 3-column grid (2+2+1 layout):
  Card 1: Read Aloud
  Card 2: Repeat Sentence
  Card 3: Describe Image
  Card 4: Respond to Situation
  Card 5: Answer Short Question

Each type card:
  Number badge (1-5) in off-white box
  Type name: text-display-sm, navy
  Short description (1-2 lines)
  Question count badge: "{count} questions"
  "View questions →" link at bottom
  Border: 1px var(--border-default)
  Hover: border-color var(--action-default), lift effect
  Clicking navigates to /speaking/{type-slug}
````

Type slug mapping:
````
read_aloud          → /speaking/read-aloud
repeat_sentence     → /speaking/repeat-sentence
describe_image      → /speaking/describe-image
respond_situation   → /speaking/respond-situation
answer_short        → /speaking/answer-short-question
````

Type descriptions:
````
Read Aloud:          "A text passage is shown. Read it aloud clearly within the time given."
Repeat Sentence:     "Listen to a sentence and repeat it exactly as you heard it."
Describe Image:      "Study the image carefully then describe what you see in detail."
Respond to Situation:"Read a situation and respond as you would in real life."
Answer Short Question:"Listen to a short question and give a brief spoken answer."
````

---

### Page 2 — Question List Page

**File:** `src/app/(student)/speaking/[type]/page.tsx`
**Type:** Client Component

Reference: Section2_Student_Portal.html — Reference 3

**Type slug to API type mapping:**
````
read-aloud              → read_aloud
repeat-sentence         → repeat_sentence
describe-image          → describe_image
respond-situation       → respond_situation
answer-short-question   → answer_short
````

**API Call:**
````
GET /api/speaking/questions?type={questionType}
Returns list of active questions for that type
Fields: id, type, content (first 80 chars for preview), speakingTime
````

**Page Structure:**
````
Breadcrumb: Speaking → {Type Name}

Page header:
  Title: {Type Name} (e.g. "Read Aloud")
  Subtitle: type description
  Right: question count badge "{n} questions"

Question list (vertical stack):
  Each question item:
    Left: index number in grey box (1, 2, 3...)
    Middle:
      Question preview text (first 80 chars + "...")
      Subtext: "{speakingTime} seconds · Speaking"
    Right: "Attempt →" button (blue)
    Hover: border-color var(--action-default)
    Clicking navigates to /speaking/{type}/{questionId}

If no questions:
  EmptyState:
    icon: "🎤"
    title: "No questions available"
    description: "Your instructor has not added any questions yet."
````

---

### Page 3 — Speaking Attempt Page (Shared Shell)

**File:** `src/app/(student)/speaking/[type]/[id]/page.tsx`
**Type:** Client Component ('use client')

Reference: Section2_Student_Portal.html — Reference 4

This is one page that handles ALL 5 question types.
It detects the type and renders the correct question component.

**Page Layout:**
````
Breadcrumb: Speaking → {Type Name} → Question {n}

Two-column layout:
  Left (flex-1): Question content area
  Right (320px): Info panel + Score panel

Left panel:
  QuestionTypeBadge component
  Instruction text (specific per type)
  Question content (specific per type — see below)
  Recording area (RecordButton component)

Right panel (top):
  Info panel card:
    Title: "Speaking Timer"
    TimerDisplay component (speaking time countdown)
    Info rows: Type, Time given, Prep time

Right panel (bottom — shown after score):
  ScoreBreakdownCard component
  Shows after submission
````

---

### Question Type Components

Create these in `src/components/speaking/`:

---

**`ReadAloudQuestion.tsx`**
```typescript
Props: { question: SpeakingQuestion, onScoreReceived: (score) => void }

State:
  phase: 'preparing' | 'recording' | 'processing' | 'scored'
  score: ScoreResult | null

Renders:
  Instruction: "Read the passage below aloud. Recording starts after preparation time."
  Passage text in scrollable box:
    Background: var(--bg-page)
    Border: var(--border-default)
    Font: text-body-lg, text-primary
    Line height: 1.8
  RecordButton component with phases

Phase flow:
  1. 'preparing': prep countdown (30 sec) → auto-starts recording
  2. 'recording': speaking countdown → audio being captured
  3. 'processing': sending to backend → "Analysing your response..."
  4. 'scored': score received → show ScoreBreakdownCard

Score bars for Read Aloud:
  Content ({contentScore}%)
  Fluency ({fluencyScore}%)
  Pronunciation ({pronunciationScore}%)
```

---

**`RepeatSentenceQuestion.tsx`**
```typescript
Props: { question: SpeakingQuestion, onScoreReceived: (score) => void }

Important: sentence text NOT shown before TTS plays.

Phase flow:
  1. 'listening': TTS speaks sentence, student listens
     Use Web Speech Synthesis: window.speechSynthesis.speak()
     Settings: lang='en-US', rate=0.9, pitch=1.0
     Show: "🎧 Listen carefully..."
     After TTS ends → 1 second pause → auto-start recording

  2. 'recording': speaking countdown (15 sec)
     Show: "🔴 Recording — Repeat the sentence"
     Waveform animation

  3. 'processing': "Analysing your response..."

  4. 'scored': show score
     Also reveal the sentence text below score:
     "The sentence was: '{sentenceText}'"

Score bars: Content, Fluency, Pronunciation
```

---

**`DescribeImageQuestion.tsx`**
```typescript
Props: { question: SpeakingQuestion, onScoreReceived: (score) => void }

Phase flow:
  1. 'preparing': show image + prep countdown (25 sec)
     Image stays visible throughout

  2. 'recording': speaking countdown (40 sec)
     Image still visible during recording
     Track actual recording duration for engagement scoring

  3. 'processing': "Analysing your response..."

  4. 'scored': show score

Score bars: Fluency, Pronunciation, Engagement

Send recordingDuration with audio to backend.
```

---

**`RespondSituationQuestion.tsx`**
```typescript
Props: { question: SpeakingQuestion, onScoreReceived: (score) => void }

Identical to DescribeImageQuestion except:
  Shows situation text paragraph instead of image
  Situation text stays visible during recording

Score bars: Fluency, Pronunciation, Engagement
```

---

**`AnswerShortQuestion.tsx`**
```typescript
Props: { question: SpeakingQuestion, onScoreReceived: (score) => void }

Phase flow:
  1. 'listening': TTS speaks the question
     After TTS ends → show question text on screen → 1 second pause
     → auto-start recording

  2. 'recording': speaking countdown (10 sec)

  3. 'processing': "Analysing your response..."

  4. 'scored': show score
     Show correct answer: "Correct answer: '{correctAnswer}'"
     correctAnswer comes from API score response

Score bars: Content ({contentScore}% — binary 0 or 100), Pronunciation
```

---

### Audio Recording Logic

Create `src/hooks/useSpeakingRecorder.ts`

```typescript
'use client'

Custom hook that handles all MediaRecorder logic.

State:
  isRecording: boolean
  audioBlob: Blob | null
  error: string | null

Functions:
  startRecording():
    1. Request mic: navigator.mediaDevices.getUserMedia({ audio: true })
    2. On denied: set error "Microphone access is required..."
    3. Create MediaRecorder from stream
    4. Collect chunks on ondataavailable
    5. On stop: create Blob from chunks, set audioBlob

  stopRecording():
    Call mediaRecorder.stop()
    Stop all audio tracks

  resetRecorder():
    Clear audioBlob, error, chunks

Returns: { isRecording, audioBlob, error, startRecording, stopRecording, resetRecorder }
```

---

### Mic Permission Denied Component

Create `src/components/speaking/MicDeniedError.tsx`

```typescript
Shows when mic permission denied:
  Icon: 🎤 with red background
  Title: "Microphone access required"
  Description: "PTEPath needs microphone access to record your speaking response."
  Instructions:
    Chrome: "Click the camera/mic icon in address bar → Allow"
    Safari: "Go to Settings → Safari → Microphone → Allow"
    Firefox: "Click the microphone icon in address bar → Allow"
  Button: "Refresh Page" → calls window.location.reload()
```

---

### Submit Audio to Backend

Create `src/lib/speaking-api.ts`

```typescript
Functions for each evaluate endpoint:

submitReadAloud(questionId, audioBlob):
  Create FormData
  Append audio file: formData.append('audio', audioBlob, 'recording.webm')
  Append questionId
  POST /api/speaking/evaluate/read-aloud
  Return score object

submitRepeatSentence(questionId, audioBlob):
  Same pattern
  POST /api/speaking/evaluate/repeat-sentence

submitDescribeImage(questionId, audioBlob, recordingDuration):
  Append audio, questionId, recordingDuration
  POST /api/speaking/evaluate/describe-image

submitRespondSituation(questionId, audioBlob, recordingDuration):
  POST /api/speaking/evaluate/respond-situation

submitAnswerShort(questionId, audioBlob):
  POST /api/speaking/evaluate/answer-short

All functions:
  Use axios instance from src/lib/api.ts
  Content-Type: multipart/form-data (axios sets this automatically with FormData)
  Return score data on success
  Throw error on failure
```

---

### Timer Logic

Create `src/hooks/useTimer.ts`

```typescript
'use client'

Props: {
  initialSeconds: number
  onExpire?: () => void
  autoStart?: boolean
}

State:
  seconds: number
  isRunning: boolean

Functions:
  start(): begin countdown
  pause(): pause countdown
  reset(): reset to initialSeconds
  stop(): stop and clear

Uses setInterval internally.
Clears interval on unmount.
Calls onExpire when seconds reach 0.

Returns: { seconds, isRunning, start, pause, reset, stop }
```

---

### Score Display After Submission

After score received from backend, show ScoreBreakdownCard in right panel.

```typescript
Read Aloud / Repeat Sentence bars:
  [
    { label: 'Content', score: contentScore },
    { label: 'Fluency', score: fluencyScore },
    { label: 'Pronunciation', score: pronunciationScore }
  ]

Describe Image / Respond to Situation bars:
  [
    { label: 'Fluency', score: fluencyScore },
    { label: 'Pronunciation', score: pronunciationScore },
    { label: 'Engagement', score: engagementScore }
  ]

Answer Short Question bars:
  [
    { label: 'Content', score: contentScore },
    { label: 'Pronunciation', score: pronunciationScore }
  ]

ScoreBreakdownCard props:
  title: "Your Score"
  displayScore: score.displayScore  — e.g. "72 / 90"
  finalScore: score.finalScore      — for color logic
  bars: array above
  feedback: score.feedback
  onNext: () => router.push('/speaking/{type}')  — back to question list
  nextLabel: "Try Another Question →"
```

---

## Page Flow Summary

````
/speaking
  → Shows 5 question type cards
  → Student clicks "Read Aloud"

/speaking/read-aloud
  → Shows list of all Read Aloud questions
  → Student clicks "Attempt →" on question 3

/speaking/read-aloud/[id]
  → Phase 1: Prep timer (30 sec)
  → Phase 2: Recording (40 sec)
  → Phase 3: Processing (2-5 sec)
  → Phase 4: Score shown
  → Student clicks "Try Another Question →"
  → Back to /speaking/read-aloud
````

---

## Mobile Considerations

Speaking module on mobile:
- MediaRecorder works on iOS 14.5+ (Safari) and Android Chrome
- RecordButton must be large enough for touch: min 64px
- Two-column layout collapses to single column on mobile
- Right panel (timer + score) moves below question on mobile
- Waveform bars: minimum 4px wide for mobile visibility

---

## Expected Output When Done
- Speaking module home shows 5 type cards with counts
- Question list shows all questions with attempt buttons
- Read Aloud: prep timer → recording → score
- Repeat Sentence: TTS plays → recording → score → sentence revealed
- Describe Image: image visible during prep and recording
- Respond to Situation: text visible during prep and recording
- Answer Short Question: TTS plays → recording → correct answer revealed
- Mic denied: friendly error with browser instructions
- Score shown with correct breakdown bars
- Mobile recording works on iOS and Android

---

## Verification Steps
1. Visit /speaking → 5 type cards with correct descriptions
2. Click "Read Aloud" → list of questions loads
3. Click "Attempt" → prep timer counts down, recording starts automatically
4. Record audio → submit → score appears in right panel
5. Click "Try Another Question" → back to question list
6. Test Repeat Sentence → sentence NOT visible during listening phase
7. Test Repeat Sentence → sentence revealed after scoring
8. Test Answer Short Question → correct answer shown after scoring
9. Deny mic permission → MicDeniedError component shown
10. Test on mobile browser → recording works

---

## Notes
- MediaRecorder API used directly — no library
- Web Speech Synthesis API used for TTS — no library
- Audio blob discarded after sending to backend
- Sentence text for Repeat Sentence hidden until after scoring
- acceptedAnswers for Answer Short never sent to frontend before scoring
- Recording auto-stops when speaking timer expires
- If Groq is slow: processing state shows loading animation
- useSpeakingRecorder and useTimer are reusable across all 5 types
- All question type components import from src/components/speaking/
- Phase state managed in each question type component

## Next Step
→ Give Claude Code `21-writing-frontend.md`
