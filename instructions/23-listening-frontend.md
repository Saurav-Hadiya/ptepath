# 23 — Listening Frontend

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/23-listening-frontend.md and implement exactly what is described."

---

## What to Build
Complete Listening module frontend including:
- Module home page (8 question type cards)
- Question list page
- Attempt pages for all 8 question types
- Audio player with play limit enforcement
- Various response types: text input, MCQ, fill blanks, clickable words
- Score display with correct answer reveal

---

## Reference Docs
- `design_reference/Section2_Student_Portal.html` — Reference 2, 3, 7 (Listening Attempt)
- `docs/md/listening-module.md` — complete listening module logic
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
- `19-speaking-frontend.md` complete (AudioPlayer component available)
- Backend listening routes working (12-listening-backend.md)

---

## Pages to Implement

### Page 1 — Listening Module Home

**File:** `src/app/(student)/listening/page.tsx`
**Type:** Client Component

Reference: Section2_Student_Portal.html — Reference 2

**API Call:**
````
GET /api/listening/questions/counts
New backend route needed.

Backend: count active listening questions per type
Returns:
{
  summarise_spoken: number,
  mcq_multiple: number,
  fill_blanks: number,
  highlight_summary: number,
  mcq_single: number,
  select_missing: number,
  highlight_incorrect: number,
  write_dictation: number
}

Add to listening routes:
GET /api/listening/questions/counts → authenticate, getListeningCounts
````

**Page Structure:**
````
Module header card:
  Listening icon (🎧) in red pale circle
  Title: "Listening Module"
  Subtitle: "8 question types · Select a type to view all questions"
  Red top border (var(--module-listening))

8 question type cards in 3-column grid (3+3+2):

Card 1: Summarise Spoken Text
  Description: "Listen to audio and write a 50–70 word summary."
  Details: "Word count + spelling scored"

Card 2: MCQ Multiple Answers
  Description: "Listen and select ALL correct answers."
  Details: "Negative marking applies"

Card 3: Fill in the Blanks
  Description: "Listen and type missing words into the transcript."
  Details: "Fuzzy matching — typos forgiven"

Card 4: Highlight Correct Summary
  Description: "Listen and select which summary best matches."
  Details: "Binary scoring"

Card 5: MCQ Single Answer
  Description: "Listen and select ONE correct answer."
  Details: "Binary scoring"

Card 6: Select Missing Word
  Description: "Listen and select the word that completes the audio."
  Details: "Binary scoring"

Card 7: Highlight Incorrect Words
  Description: "Listen and click words in transcript that differ from audio."
  Details: "Negative marking applies"

Card 8: Write from Dictation
  Description: "Listen and type exactly what you hear."
  Details: "Word match + spelling scored"

Type slug mapping:
  summarise_spoken     → /listening/summarise-spoken
  mcq_multiple         → /listening/mcq-multiple
  fill_blanks          → /listening/fill-blanks
  highlight_summary    → /listening/highlight-correct-summary
  mcq_single           → /listening/mcq-single
  select_missing       → /listening/select-missing-word
  highlight_incorrect  → /listening/highlight-incorrect-words
  write_dictation      → /listening/write-dictation
````

---

### Page 2 — Question List Page

**File:** `src/app/(student)/listening/[type]/page.tsx`
**Type:** Client Component

Same layout as all other module question lists.

**Type slug to API type mapping:**
````
summarise-spoken           → summarise_spoken
mcq-multiple               → mcq_multiple
fill-blanks                → fill_blanks
highlight-correct-summary  → highlight_summary
mcq-single                 → mcq_single
select-missing-word        → select_missing
highlight-incorrect-words  → highlight_incorrect
write-dictation            → write_dictation
````

**API Call:**
````
GET /api/listening/questions?type={questionType}
Returns: list of active questions
Fields: id, type, question (preview), playLimit
````

**Question preview text per type:**
````
summarise_spoken:    "Audio + written summary task"
mcq_multiple:        question text preview
fill_blanks:         "Audio + fill blank transcript"
highlight_summary:   "Audio + select correct summary"
mcq_single:          question text preview
select_missing:      "Audio ends with beep — select missing word"
highlight_incorrect: "Audio + click incorrect words in transcript"
write_dictation:     "Audio + type exactly what you hear"
````

---

### Page 3 — Listening Attempt Page

**File:** `src/app/(student)/listening/[type]/[id]/page.tsx`
**Type:** Client Component ('use client')

Reference: Section2_Student_Portal.html — Reference 7

One page handles all 8 question types.

**API Call:**
````
GET /api/listening/{type}/{id}
Returns question with audioUrl, playLimit
Correct answers stripped by backend
````

**Page Layout:**
````
Breadcrumb: Listening → {Type Name} → Question {n}

Two-column layout:
  Left (flex-1): Audio player + question content + response area
  Right (280px): Info panel + Score panel

Audio player ALWAYS at top of left column:
  AudioPlayer component (from shared components)
  audioUrl from question data
  playLimit from question data
  Prominent — student must listen before answering

Info panel:
  Type: {question type name}
  Scoring: scoring method
  Play limit: "Once" or "Unlimited"
````

---

### Question Type Components

Create in `src/components/listening/`:

---

**`SummariseSpokenQuestion.tsx`**

```typescript
Props: { question: ListeningQuestion, onScoreReceived: (score) => void }

Same as Writing SummariseWrittenText BUT:
  No passage shown — only audio player
  Instruction: "Listen to the audio. Write a 50–70 word summary of what you heard."
  Word range: 50–70 words
  Timer: 10 minutes (same as SWT)
  Auto-submit on timer expiry

Word counter states:
  0-29 words:  var(--text-muted)
  30-49 words: var(--feedback-warning)  — amber (acceptable range)
  50-70 words: var(--feedback-success)  — green (target range)
  71+ words:   var(--feedback-error)    — red (over limit, block at 85)

Score bars:
  Word Count score
  Spelling score
  + misspelled words shown
```

---

**`MCQMultipleListeningQuestion.tsx`**

```typescript
Identical to Reading MCQMultipleQuestion EXCEPT:
  Audio player shown at top instead of passage
  No passage text
  Question text shown below audio player
  Same checkbox logic
  Same negative marking warning
  Same scoring display

Reuse MCQOption component.
```

---

**`FillBlanksListeningQuestion.tsx`**

```typescript
Props: { question: ListeningQuestion, onScoreReceived: (score) => void }

State:
  answers: Record<number, string>  — blank index → typed text
  submitted: boolean

Renders:

Instruction:
  "Listen to the audio. Type the missing words into the
   blank spaces in the transcript below."
  Fuzzy match note: "Minor spelling mistakes are accepted."

Audio player at top.

Transcript with inline text inputs:
  Parse transcript text
  Replace blank markers with <input> elements
  Each input: small width (120px), inline
  Placeholder: "..."
  Font matches surrounding transcript text
  Focus border: var(--action-default)
  After submission: disabled

Submit button:
  Enabled when all blanks have text
  Text: "Submit Answers"

On submit:
  answers = ordered array of typed values
  POST /api/listening/evaluate with
    { questionId, questionType: 'fill_blanks', answer: answersArray }

After score — per blank result:
  Exact match:   green input, "✓ Exact"
  Close (fuzzy): amber input, "~ Close (correct: '{word}')"
  Wrong:         red input, "✗ Wrong (correct: '{word}')"
```

---

**`HighlightSummaryQuestion.tsx`**

```typescript
Identical to Reading MCQSingleQuestion EXCEPT:
  Audio player shown instead of passage
  Options are full paragraphs (not short options)
  Each option: full paragraph text in radio card
  Selected: blue pale border
  After submission: correct = green, wrong = red

Instruction:
  "Listen to the audio. Select the paragraph that best
   summarises what you heard."
```

---

**`MCQSingleListeningQuestion.tsx`**

```typescript
Identical to Reading MCQSingleQuestion EXCEPT:
  Audio player shown instead of passage
  Question text shown below audio

Reuse MCQOption component.
```

---

**`SelectMissingWordQuestion.tsx`**

```typescript
Identical to MCQSingleListeningQuestion EXCEPT:

Instruction:
  "The audio ends with a beep. Select the word or phrase
   that correctly completes what was being said."

Options are short words/phrases (not full sentences).
Same MCQOption component, same scoring display.
```

---

**`HighlightIncorrectWordsQuestion.tsx`**

```typescript
Props: { question: ListeningQuestion, onScoreReceived: (score) => void }

State:
  clickedIndices: number[]
  submitted: boolean

Important:
  incorrectWordIndices NOT available before submission.
  Student finds incorrect words by listening and clicking.

Renders:

Instruction:
  "Listen to the audio. Click on the words in the transcript
   below that are DIFFERENT from what you hear in the audio."
  Click hint: "Click a word to mark it. Click again to unmark."
  Negative marking warning:
    "⚠ Clicking a correct word deducts points."

Audio player at top.

Transcript as clickable word spans:
  Split transcript into individual word tokens
  Each word: <span> element with word index
  Default: normal text, no highlight
  Clicked: red pale bg, red text, slight underline
    Background: var(--feedback-error-bg)
    Color: var(--feedback-error)
  Hover: amber pale bg (visual hint it is clickable)
    Cursor: pointer

Submit button:
  Enabled always (can submit with 0 clicks)
  Text: "Submit"

On submit:
  POST /api/listening/evaluate with
    { questionId, questionType: 'highlight_incorrect', answer: clickedIndices }

After score — per word result:
  correct_click:  green span (clicked correctly)
  wrong_click:    red span with ✗ (clicked a correct word)
  missed:         amber span with ! (should have clicked, did not)
  neutral:        no change (not clicked, not incorrect — correct)

Show summary: "{n} of {total} incorrect words found"
```

---

**`WriteDictationQuestion.tsx`**

```typescript
Props: { question: ListeningQuestion, onScoreReceived: (score) => void }

State:
  answer: string
  submitted: boolean

Renders:

Instruction:
  "Listen to the audio. Type exactly what you hear."
  Replay note: shown based on playLimit

Audio player at top.
(Student may replay if playLimit allows)

Single input field:
  Full width
  Font: text-body-lg
  Placeholder: "Type what you hear..."
  Border: var(--border-default)
  Focus: var(--action-default)
  After submission: disabled

Submit button:
  Enabled when input not empty
  Text: "Submit"

On submit:
  POST /api/listening/evaluate with
    { questionId, questionType: 'write_dictation', answer: answerText }

After score — word by word breakdown:
  Show correct sentence: "Correct: '{correctSentence}'"
  Show breakdown table:

  Word comparison rows:
    Correct word | Your word | Result
    "The"        | "The"     | ✓ Exact
    "scientists" | "sientists"| ~ Close
    "discovered" | "discoverd"| ~ Close
    "species"    | "spesies"  | ~ Close
    "last"       | "last"     | ✓ Exact

  Result icons:
    Exact:  ✓ green
    Close:  ~ amber (accepted with partial credit)
    Missed: ✗ red

Score breakdown:
  Word Match: {wordMatchScore}%
  Spelling:   {spellingScore}%
```

---

### Score Display — Listening Specific

```typescript
After submission show ScoreBreakdownCard in right panel.

Bars per type:

summarise_spoken:
  [ { label: 'Word Count', score: wordCountScore },
    { label: 'Spelling', score: spellingScore } ]
  + misspelled words section

mcq_multiple:
  [ { label: 'Accuracy', score: finalScore } ]
  + option results breakdown

fill_blanks:
  [ { label: 'Accuracy', score: finalScore } ]
  + per-blank breakdown inline

highlight_summary / mcq_single / select_missing:
  No bars — binary result
  Large ScoreDisplay (90/90 or 0/90)

highlight_incorrect:
  [ { label: 'Accuracy', score: finalScore } ]
  + "{n} of {total} incorrect words found"

write_dictation:
  [ { label: 'Word Match', score: wordMatchScore },
    { label: 'Spelling', score: spellingScore } ]
  + word breakdown table
```

---

### Submit Listening Answer

Create `src/lib/listening-api.ts`

```typescript
submitListening(questionId, questionType, answer):
  POST /api/listening/evaluate
  Body: { questionId, questionType, answer }
  Returns full score result

answer format per type:
  summarise_spoken:   string (written summary)
  mcq_multiple:       string[] (selected labels)
  fill_blanks:        string[] (typed words)
  highlight_summary:  string (selected label)
  mcq_single:         string (selected label)
  select_missing:     string (selected label)
  highlight_incorrect: number[] (clicked indices)
  write_dictation:    string (typed sentence)

Use useMutation from TanStack Query.
```

---

### TanStack Query Setup

```typescript
Fetch question:
const { data: question, isLoading } = useQuery({
  queryKey: ['listening-question', type, id],
  queryFn: () => api.get(`/listening/${type}/${id}`).then(r => r.data.data)
})

Submit:
const submitMutation = useMutation({
  mutationFn: (payload) =>
    submitListening(payload.questionId, payload.questionType, payload.answer),
  onSuccess: (data) => {
    setResults(data)
    setSubmitted(true)
  }
})
```

---

## Page Flow Summary

````
/listening
  → 8 question type cards

/listening/write-dictation
  → List of Write Dictation questions

/listening/write-dictation/[id]
  → Audio player at top
  → Single text input below
  → Student listens, types what heard
  → Submit → word-by-word comparison shown

/listening/highlight-incorrect-words/[id]
  → Audio player at top
  → Clickable transcript below
  → Student listens, clicks differing words
  → Submit → correct/wrong/missed words revealed
````

---

## Mobile Considerations

````
Audio player:
  Full width on mobile
  Play button: min 44px touch target
  Play limit badge: visible below player

Highlight Incorrect Words on mobile:
  Word spans: larger touch area (padding around each word)
  Line height: increased for easier tapping between words

Write Dictation on mobile:
  Input field: full width
  Font size: at least 16px to prevent iOS auto-zoom
  (input font-size < 16px causes iOS to zoom in)

Fill Blanks inputs on mobile:
  Inline inputs in transcript: min width 80px
  Touch friendly enough for small blanks
````

---

## Expected Output When Done
- Listening module home shows 8 type cards
- Question list works for all 8 types
- Audio player shown on every attempt page
- Play limit enforced correctly (play once vs unlimited)
- Summarise Spoken: text area with word counter
- MCQ Multiple: checkboxes with negative marking warning
- Fill Blanks: inline inputs in transcript
- Highlight Summary: full paragraph radio options
- MCQ Single: standard radio options
- Select Missing Word: word/phrase radio options
- Highlight Incorrect: clickable word spans
- Write Dictation: single input with word breakdown after
- All scores shown in correct format after submission

---

## Verification Steps
1. Visit /listening → 8 type cards with correct descriptions
2. AudioPlayer: plays audio, play limit badge shows correctly
3. AudioPlayer: blocks after 1 play (if playLimit=1)
4. Write Dictation: type sentence, submit, word breakdown shown
5. Highlight Incorrect: click words, submit, correct/wrong/missed shown
6. Fill Blanks: type in inline inputs, submit, fuzzy result shown
7. MCQ Multiple: select options, negative marking warning visible
8. Highlight Summary: large paragraph options selectable
9. All types: correct answer revealed after submission
10. Mobile: audio player and inputs work with touch

---

## Notes
- AudioPlayer component from shared components used on all 8 pages
- incorrectWordIndices never sent to frontend before submission
- correctSentence never sent to frontend before submission
- Transcript shown for fill_blanks and highlight_incorrect only
- Fuzzy match note shown on fill_blanks ("typos forgiven")
- Negative marking warning shown on mcq_multiple and highlight_incorrect
- No timer in practice mode for listening
- Write Dictation input: font-size min 16px on mobile (prevents iOS zoom)
- All types use same POST /api/listening/evaluate endpoint
- answer format varies per type — see listening-api.ts

## Next Step
→ Give Claude Code `24-mocktest-frontend.md`
