# Reading Module — Complete Blueprint

## Overview

**Platform:** PTEPath — PTE Exam Practice Platform
**Module:** Reading
**Question Types:** 5
**Scoring:** 100% rule-based. Pure JavaScript. No AI. No packages. No paid services.
**Cost:** Rs. 0

---

## Tech Stack — Reading Module

| Concern | Decision | Tool | Cost |
|---|---|---|---|
| Scoring | Server-side | Pure JavaScript — no packages | Free |
| Drag and drop (Q-Types 1 & 3) | Frontend | @dnd-kit/core (npm) | Free |
| Correct answers | Stored in DB | Sent to frontend only after submission | — |
| Response storage | Not stored | Discarded after scoring | Free |
| Score storage | MongoDB Atlas | Lightweight update only | Free tier |

---

## Question Types at a Glance

| # | Question Type | Student Action | Scoring | Partial Credit |
|---|---|---|---|---|
| 1 | R&W Fill in the Blanks | Drag words into blanks | Per blank 1/0 | Yes |
| 2 | MCQ Multiple Answers | Select all correct checkboxes | +1/-1 per option | Yes |
| 3 | Re-order Paragraphs | Drag boxes into correct sequence | Pair-based | Yes |
| 4 | Reading Fill in the Blanks | Select from dropdown per blank | Per blank 1/0 | Yes |
| 5 | MCQ Single Answer | Select one radio button | Binary 100/0 | No |

---

## Storage Rule — All 5 Types

No per-attempt records stored.
On every submission update only:
- Question document: `attemptCount` +1, `avgScore` rolling average
- Student document: `totalAttempts` +1, `lastActiveAt` timestamp

Student answers discarded after scoring. Never stored.

Rolling average formula:
````
newAvg = ((currentAvg × currentCount) + newScore) / (currentCount + 1)
````

---

## Correct Answer Rule — All 5 Types

Correct answers stored in DB when admin adds the question.
**Never sent to frontend before submission.**
Sent to frontend only inside the score response after submission.

---

## Single Evaluate Endpoint

All 5 question types use one shared endpoint:
`POST /api/reading/evaluate`

Request body must include `questionType` field.
Backend routes to correct scoring function based on this field.

---

## Question Type 1 — R&W Fill in the Blanks

### What It Is
Passage with blank spaces shown. A shared pool of words shown below. Student drags correct word into each blank. Tests reading comprehension and vocabulary.

### Admin Setup
- Navigate: Admin Panel → Reading → R&W Fill in the Blanks → Add Question
- Fields:
  - **Passage with blanks** — mark each blank as `[BLANK]` in the text
  - **Word pool** — all words to display (correct answers + 2–3 distractors)
  - **Correct answer per blank** — map each [BLANK] position to its correct word

**Example:**
````
Passage: "The [BLANK] of climate change has become a [BLANK] concern."
Word pool: impact, affect, serious, minor, rise, global
Blank 1 correct: impact
Blank 2 correct: serious
````

### Student Flow
1. Passage shown with empty drop zones at each blank
2. Word pool shown below as draggable chips
3. Student drags word into blank — word disappears from pool
4. Student can drag word back out to change answer
5. Clicks Submit when ready
6. Score shown: each blank result + correct answer for wrong ones

### Developer — Frontend
- Library: `@dnd-kit/core` for drag and drop
- State to track: `wordPool` (remaining words array) + `blanks` (object: blank index → selected word)
- On word dropped into blank: remove from wordPool, add to blanks state
- On word dragged back: return to wordPool, clear from blanks state
- On submit: `POST /api/reading/evaluate` with `{ questionId, questionType: 'rw_fill_blanks', answers: ['impact', 'serious'] }`

### Developer — Backend
- Receive answers array from request
- Fetch correct answers array from DB using questionId
- Compare index by index: `answers[i] === correctAnswers[i]`
- Calculate score
- Return score + correctAnswers array to frontend

### Scoring Logic
````
Each blank = 1 point
Correct word → 1 point
Wrong word   → 0 points
Score = (correct blanks / total blanks) × 100

Example: 4 blanks, 3 correct → 3/4 × 100 = 75%
````

### Result Display
````
Blank 1: You chose 'affect'  ✗ Wrong  → Correct: 'impact'
Blank 2: You chose 'serious' ✓ Correct
Blank 3: You chose 'rise'    ✗ Wrong  → Correct: 'global'
Blank 4: You chose 'minor'   ✓ Correct
Score: 2/4 → 50%
````

---

## Question Type 2 — MCQ Multiple Answers

### What It Is
Passage and question shown. Student selects ALL correct options from 5–7 choices. More than one answer is correct. Negative marking prevents random selection.

### Admin Setup
- Navigate: Admin Panel → Reading → MCQ Multiple Answers → Add Question
- Fields:
  - **Passage text**
  - **Question text**
  - **Options** (5–7 options, each marked correct or incorrect)

### Student Flow
1. Passage and question shown. Options as checkboxes.
2. Student checks all options they think are correct. Can uncheck freely.
3. Clicks Submit
4. Each option revealed as: correct selection, wrong selection, or missed correct

### Developer — Frontend
- Render options as checkboxes
- Track selected options in state array
- On submit: `POST /api/reading/evaluate` with `{ questionId, questionType: 'mcq_multiple', answers: ['A', 'C'] }`

### Developer — Backend
- Fetch options with isCorrect flags from DB
- For each option: evaluate as selected+correct, selected+wrong, or not selected
- Calculate score with negative marking
- Return score + full options array with correct flags revealed

### Scoring Logic — Negative Marking
````
Selected + Correct → +1 point
Selected + Wrong   → -1 point  (negative marking)
Not selected       →  0 points (no penalty either way)

Score = max(0, totalPoints) / numberOfCorrectOptions × 100

Example:
Correct options: A, C, E  (3 correct total)
Student selected: A, B, C
  A: selected + correct = +1
  B: selected + wrong   = -1
  C: selected + correct = +1
  D: not selected       =  0
  E: not selected       =  0
Total = 1 / 3 × 100 = 33%

Note: Score cannot go below 0%. Cap at 0 if negative total.
````

### Result Display — Four States
````
[✓] A. Deforestation      ✓ Correct — good selection
[✓] B. Solar activity     ✗ Wrong   — should not have selected this
[✓] C. Industrial emis.   ✓ Correct — good selection
[ ] D. Ocean currents     ! Missed  — this was also correct
[ ] E. Population growth  ! Missed  — this was also correct
Score: 1/3 → 33%
````

States:
- ✓ Selected + Correct → green highlight
- ✗ Selected + Wrong → red highlight
- ! Not selected + Correct (missed) → amber highlight
- Not selected + Wrong → no highlight (neutral)

---

## Question Type 3 — Re-order Paragraphs

### What It Is
Paragraph boxes shown scrambled in a Source panel. Student drags them into an Answer panel in correct logical order. Tests understanding of text structure and flow.

### Admin Setup
- Navigate: Admin Panel → Reading → Re-order Paragraphs → Add Question
- Fields:
  - **Paragraphs** — enter each paragraph as a separate text block in the correct order
  - The order admin enters them = the correct answer (stored as sequence A→B→C→D)
  - System auto-shuffles display order for students

### Student Flow
1. Two panels shown side by side: Source (all boxes scrambled) + Answer (empty)
2. Student drags boxes from Source to Answer panel
3. Can reorder within Answer panel by dragging
4. Once a box moves to Answer, it disappears from Source
5. Clicks Submit when all boxes placed
6. Score shown: student order vs correct order side by side

### Developer — Frontend
- Same `@dnd-kit/core` library as Q-Type 1 (reused)
- State: `sourcePool` (remaining boxes) + `answerSequence` (ordered array)
- On submit: `POST /api/reading/evaluate` with `{ questionId, questionType: 'reorder_paragraphs', answers: ['C', 'A', 'B', 'D'] }`

### Developer — Backend
- Fetch correct order array from DB
- Run pair-based scoring algorithm
- Return score + correctSequence array

### Scoring Logic — Pair-Based
````
Total possible pairs = n × (n-1) / 2
(where n = number of paragraphs)

For 4 paragraphs: 4 × 3 / 2 = 6 pairs

Correct order: A → B → C → D
All correct pairs: (A,B) (A,C) (A,D) (B,C) (B,D) (C,D)

For each pair: check if left item appears before right item in student's answer.
Count correct pairs.

Score = correctPairs / totalPairs × 100

Example:
Student answer: A → C → B → D
  (A,B): A pos 1, B pos 3 → correct ✓
  (A,C): A pos 1, C pos 2 → correct ✓
  (A,D): A pos 1, D pos 4 → correct ✓
  (B,C): B pos 3, C pos 2 → wrong   ✗
  (B,D): B pos 3, D pos 4 → correct ✓
  (C,D): C pos 2, D pos 4 → correct ✓
Correct pairs: 5/6 → 83%
````

### Result Display
````
Your Order          Correct Order
1. A ✓              1. A
2. C ✗              2. B
3. B ✗              3. C
4. D ✓              4. D
Score: 5/6 pairs → 83%
````

---

## Question Type 4 — Reading Fill in the Blanks

### What It Is
Passage with blank spaces shown. Each blank has its own independent dropdown with 4–5 options. Student selects one word per dropdown.

**Key difference from Q-Type 1:** Uses dropdowns (not drag-and-drop). Each blank has its own separate option set, not a shared pool.

### Admin Setup
- Navigate: Admin Panel → Reading → Reading Fill in the Blanks → Add Question
- Fields:
  - **Passage with blanks** — mark as `[BLANK]` same as Q-Type 1
  - **Per blank:** add 4–5 options and mark which one is correct
  - Each blank has completely independent options

### Student Flow
1. Passage shown with inline dropdown at each blank position
2. Student selects one word from each dropdown
3. Can change before submitting
4. Clicks Submit
5. Score shown per blank with correct answer revealed

### Developer — Frontend
- Render inline `<select>` dropdowns at each [BLANK] position
- Track selections in state object: `{ blank0: 'remarkable', blank1: '' }`
- On submit: `POST /api/reading/evaluate` with `{ questionId, questionType: 'reading_fill_blanks', answers: ['remarkable', 'tensions'] }`

### Developer — Backend
- Fetch blanks array from DB (each blank has correctAnswer + options)
- Compare student answers index by index
- Identical scoring function to Q-Type 1 (`fillBlankScore()` — reused)
- Return score + correctAnswers

### Scoring Logic
````
Identical to Q-Type 1:
Each blank = 1 point
Correct selection → 1 point
Wrong selection   → 0 points
Score = (correct / total) × 100
````

### Result Display
````
Blank 1: You chose 'remarkable' ✓ Correct
Blank 2: You chose 'calm'       ✗ Wrong → Correct: 'tensions'
Blank 3: You chose 'slight'     ✗ Wrong → Correct: 'rapid'
Score: 1/3 → 33%
````

---

## Question Type 5 — MCQ Single Answer

### What It Is
Passage and question shown. Student selects exactly one correct answer from 4–5 options. Binary scoring — correct or wrong.

### Admin Setup
- Navigate: Admin Panel → Reading → MCQ Single Answer → Add Question
- Fields:
  - **Passage text**
  - **Question text**
  - **Options** (4–5 options, mark exactly one as correct)

### Student Flow
1. Passage and question shown. Options as radio buttons (only one selectable).
2. Student clicks their answer
3. Clicks Submit
4. Correct answer highlighted. Wrong answer highlighted.

### Developer — Frontend
- Render as radio button group
- Track single selected option in state
- On submit: `POST /api/reading/evaluate` with `{ questionId, questionType: 'mcq_single', answer: 'B' }`

### Developer — Backend
- Fetch correct option label from DB
- Compare student answer to correct answer
- Binary result: 100% or 0%
- Return score + correctOption for display

### Scoring Logic
````
Selected = correct → 100%
Selected = wrong   → 0%
No partial credit.
````

### Result Display
````
○ A. Technology improves productivity  — Your answer ✗ Wrong
● B. Automation causes unemployment    — Correct answer ✓
○ C. Education reduces poverty
○ D. Trade increases inequality
Score: 0/1 → 0%
````

---

## Database Schema — Reading Module

### Reading Questions Collection (`reading_questions`)

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated |
| type | String | rw_fill_blanks \| mcq_multiple \| reorder_paragraphs \| reading_fill_blanks \| mcq_single |
| passage | String | The reading passage text |
| question | String | Question text (null for fill-blanks and reorder types) |
| blanks | Array | Fill-blank types: `[{ position, correctAnswer, options[] }]` |
| options | Array | MCQ types: `[{ label, text, isCorrect }]` |
| paragraphs | Array | Reorder type: `[{ label, text }]` in correct order |
| wordPool | Array | R&W Fill Blanks only: all words including distractors |
| isActive | Boolean | Controls visibility to students |
| createdAt | Timestamp | Auto-set |
| attemptCount | Integer | Incremented per submission |
| avgScore | Float | Rolling average — updated per submission |

---

## API Routes — Reading Module

### Student Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/reading/:type/:id | Fetch one question by type and ID |
| GET | /api/reading/:type/random | Fetch random question of given type |
| POST | /api/reading/evaluate | Submit answer for any reading question type |

### Admin Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/admin/reading/questions | List all questions with type filter |
| POST | /api/admin/reading/questions | Add new question |
| PUT | /api/admin/reading/questions/:id | Edit question |
| DELETE | /api/admin/reading/questions/:id | Delete question |
| PATCH | /api/admin/reading/questions/:id/status | Toggle active/inactive |

### Evaluate Endpoint — Request Format

```json
{
  "questionId": "abc123",
  "questionType": "mcq_multiple",
  "answers": ["A", "C"]
}
```

`questionType` values: `rw_fill_blanks` | `mcq_multiple` | `reorder_paragraphs` | `reading_fill_blanks` | `mcq_single`

---

## Score Response Format — All Types

```json
{
  "finalScore": 75,
  "displayScore": "68 / 90",
  "correctAnswers": ["impact", "serious"],
  "feedback": "2 out of 4 blanks correct. Review the incorrect words carefully.",
  "breakdown": [
    { "blank": 1, "studentAnswer": "affect", "correctAnswer": "impact", "correct": false },
    { "blank": 2, "studentAnswer": "serious", "correctAnswer": "serious", "correct": true }
  ]
}
```

---

## Shared Code — Reuse Rules

| Shared Function | Used By |
|---|---|
| `fillBlankScore(studentAnswers, correctAnswers)` | Q-Type 1 and Q-Type 4 |
| `@dnd-kit/core` drag library | Q-Type 1 and Q-Type 3 frontend |
| Single `POST /api/reading/evaluate` endpoint | All 5 question types |

---

## Key Rules — Must Follow While Building

- All scoring is server-side pure JavaScript. Zero scoring packages needed.
- Correct answers stored in DB. Sent to frontend only AFTER submission — never before.
- No per-attempt records. Only `attemptCount` and `avgScore` updated on question document.
- Q-Types 1 and 4 share one `fillBlankScore()` function — do not duplicate.
- Q-Types 1 and 3 share the same `@dnd-kit/core` library on frontend.
- All 5 types use one evaluate endpoint — routed by `questionType` field.
- MCQ Multiple score cannot go below 0% — cap at 0 if negative marking produces negative total.
- Scores out of 90. `displayScore = finalPercent × 90`.
- No difficulty field stored — removed from this platform.
- Correct answer always shown after submission for all 5 types.
