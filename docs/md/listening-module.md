# Listening Module — Complete Blueprint

## Overview

**Platform:** PTEPath — PTE Exam Practice Platform
**Module:** Listening
**Question Types:** 8
**Scoring:** Rule-based only. No AI. No paid services.
**Audio:** Admin uploads MP3/WAV/M4A files → stored on Cloudinary → played to student.
**New packages needed:** fastest-levenshtein (free npm) — used for 2 question types only.

---

## Tech Stack — Listening Module

| Concern | Decision | Tool | Cost |
|---|---|---|---|
| Audio storage | Cloudinary | Admin uploads MP3/WAV/M4A max 5MB | Free tier |
| Audio playback | Browser | Standard HTML audio element | Free |
| Scoring (5 types) | Server-side | Reused from Writing + Reading modules | Free |
| Fuzzy matching (2 types) | Server-side | fastest-levenshtein (npm) | Free |
| Spell checking (1 type) | Server-side | nspell + dictionary-en (reused from Writing) | Free |
| Response storage | Not stored | Discarded after scoring | Free |

---

## Key Design Decision — Audio

Admin uploads a pre-recorded audio file for every question.
The platform **only plays** the audio to the student.
Admin manually enters all question data (correct answers, options, transcripts) separately.
**The platform never reads, processes, or transcribes the audio file.**

Audio file deleted from Cloudinary when admin deletes a question.

---

## Audio Player — Student Experience (All 8 Types)

Every question starts the same way:

1. Audio player shown at top of screen
2. Student clicks Play — audio does NOT auto-play
3. Student listens, then answers below

| Setting | Description |
|---|---|
| Play limit | Admin sets: play once (default) or unlimited replays |
| Controls | Standard play/pause only. No skip forward/back. |
| Format accepted | MP3, WAV, M4A. Max 5MB per file. |

---

## Storage Rule — All 8 Types

No per-attempt records stored.
On every submission update only:
- Question document: `attemptCount` +1, `avgScore` rolling average
- Student document: `totalAttempts` +1, `lastActiveAt` timestamp

Student answers discarded after scoring. Never stored.

---

## Single Evaluate Endpoint

All 8 types share one endpoint: `POST /api/listening/evaluate`
Request body includes `questionType` field.
Backend routes to correct scoring function based on this field.
Reused functions from Writing and Reading modules called directly.

---

## Question Types — Scoring Reuse Overview

| Type | Scoring Method | Reuses |
|---|---|---|
| Summarise Spoken Text | Word count + Spelling | Writing module functions |
| MCQ Multiple Answers | Per option +1/-1 | Reading module function |
| Fill in the Blanks | Per blank fuzzy match | Minor tweak — new logic |
| Highlight Correct Summary | Binary correct/wrong | Reading MCQ Single function |
| MCQ Single Answer | Binary correct/wrong | Reading MCQ Single function |
| Select Missing Word | Binary correct/wrong | Reading MCQ Single function |
| Highlight Incorrect Words | Per word +1/-1 | New simple function |
| Write from Dictation | Fuzzy word match + Spelling | New function |

---

## Question Type 1 — Summarise Spoken Text

### What It Is
Student listens to a 60–90 second audio clip then writes a 50–70 word summary.
Tests listening comprehension and written expression.

### Admin Setup
- Navigate: Admin Panel → Listening → Summarise Spoken Text → Add Question
- Fields:
  - **Audio file** (MP3/WAV/M4A, max 5MB — preview player shown before saving)
  - **Play limit** (once or unlimited)
- No correct answer needed. Open-ended response.

### Student Flow
1. Audio player shown. Student clicks Play and listens.
2. Textarea shown below with word counter: "0 / 70 words"
3. Counter turns green at 50 words (minimum). Blocks at 70 words.
4. Submit enabled from 30 words. Auto-submit when 10-minute timer expires.
5. Score shown: word count score + spelling score + feedback

### Developer — Backend
- Call exact same scoring functions as Writing module `Write Essay`
- Word count scoring (50%): in range 50–70 = 100%, below 30 = 0%, 30–49 = 60%
- Spelling scoring (50%): `checkSpelling(responseText)` shared utility from Writing module
- No new code needed

### Scoring

| Criterion | Weight | Method |
|---|---|---|
| Word Count | 50% | In range 50–70 = 100%. Below 30 = 0%. 30–49 = 60%. |
| Spelling | 50% | nspell — correctly spelled / total words × 100 |

---

## Question Type 2 — MCQ Multiple Answers

### What It Is
Audio clip plays. Question shown. Student selects ALL correct options from 5–7 choices.

### Admin Setup
- Navigate: Admin Panel → Listening → MCQ Multiple Answers → Add Question
- Fields:
  - **Audio file**
  - **Play limit**
  - **Question text**
  - **Options** (5–7, mark all correct ones)

### Student Flow
1. Audio plays. Question + checkbox options shown.
2. Student checks all options they believe are correct.
3. Submits. Each option revealed as correct/wrong/missed.

### Developer — Backend
- Call exact same scoring function as Reading MCQ Multiple Answers
- No new code needed

### Scoring
````
Selected + Correct → +1
Selected + Wrong   → -1  (negative marking)
Not selected       →  0
Score = max(0, total) / numberOfCorrectOptions × 100
````

---

## Question Type 3 — Fill in the Blanks

### What It Is
Audio plays while partial transcript shown on screen with blank spaces.
Student types missing word into each blank while listening.
Fuzzy matching used because student types under real-time audio pressure.

### Admin Setup
- Navigate: Admin Panel → Listening → Fill in the Blanks → Add Question
- Fields:
  - **Audio file**
  - **Play limit**
  - **Transcript with blanks** — mark missing words as `[BLANK]`
  - **Correct word per blank**

**Example:**
````
Transcript: "The [BLANK] has increased significantly due to [BLANK] factors."
Blank 1 correct: population
Blank 2 correct: economic
````

### Student Flow
1. Audio player and partial transcript shown simultaneously
2. Student clicks Play. Empty text inputs shown at each blank.
3. Student types into blanks while listening. Can pause and retype.
4. Submits. Each blank shown as correct/close/wrong with correct answer revealed.

### Developer — Frontend
- Render transcript with `<input>` fields at each [BLANK] position
- Track typed values in state object
- On submit: `POST /api/listening/evaluate` with `{ questionId, questionType: 'fill_blanks', answers: ['population', 'economic'] }`

### Developer — Backend
- Package: `fastest-levenshtein` — `npm install fastest-levenshtein`
- For each blank: calculate edit distance between student input and correct word
- Apply partial credit scoring

### Scoring — Fuzzy Match with Partial Credit
````
Exact match (distance = 0) → 1.0 point  (full credit)
Edit distance = 1           → 0.7 point  (minor typo)
Edit distance = 2           → 0.4 point  (acceptable under pressure)
Edit distance > 2           → 0.0 point  (wrong)

Score = total points / total blanks × 100
````

### Result Display
````
Blank 1: You typed 'incresed'  ~ Close  (increased) → 0.7 pts
Blank 2: You typed 'economic'  ✓ Correct             → 1.0 pt
Blank 3: You typed 'govermnt'  ✗ Wrong  (government) → 0.0 pts
Score: 1.7/3 → 57%
````

---

## Question Type 4 — Highlight Correct Summary

### What It Is
Audio clip plays. Student shown 3–4 paragraph summaries. Selects which one best summarises what they heard.

### Admin Setup
- Navigate: Admin Panel → Listening → Highlight Correct Summary → Add Question
- Fields:
  - **Audio file**
  - **Play limit**
  - **3–4 summary paragraph options** — mark exactly one as correct

### Student Flow
1. Audio plays. 3–4 summary paragraphs shown as radio button options.
2. Student selects one.
3. Submits. Correct summary highlighted. Score shown.

### Developer — Backend
- Call exact same scoring function as Reading MCQ Single Answer
- No new code needed

### Scoring
````
Selected correct summary → 100%
Selected wrong summary   → 0%
````

---

## Question Type 5 — MCQ Single Answer

### What It Is
Audio clip plays. Question asked. Student selects one correct answer from 4–5 options.

### Admin Setup
- Navigate: Admin Panel → Listening → MCQ Single Answer → Add Question
- Fields:
  - **Audio file**
  - **Play limit**
  - **Question text**
  - **Options** (4–5, mark exactly one correct)

### Student Flow
1. Audio plays. Question + radio button options shown.
2. Student selects one option. Submits.
3. Correct answer highlighted. Score shown.

### Developer — Backend
- Call exact same scoring function as Reading MCQ Single Answer
- No new code needed

### Scoring
````
Correct option selected → 100%
Wrong option selected   → 0%
````

---

## Question Type 6 — Select Missing Word

### What It Is
Audio plays but last word/phrase is replaced by a beep sound.
Student selects which word/phrase correctly completes the audio.

### Admin Setup
- Navigate: Admin Panel → Listening → Select Missing Word → Add Question
- Fields:
  - **Audio file** — admin prepares this audio externally with beep already inserted. Platform just plays it.
  - **Play limit**
  - **Options** (4–5 word/phrase choices, mark one correct)

> **Note:** Admin is responsible for preparing the audio with the beep before uploading. No audio editing happens on the server.

### Student Flow
1. Audio plays ending with a beep.
2. Options shown as radio buttons. Student picks the completing word/phrase.
3. Submits. Correct answer shown. Score displayed.

### Developer — Backend
- Identical to MCQ Single Answer scoring
- No new code needed

### Scoring
````
Correct option selected → 100%
Wrong option selected   → 0%
````

---

## Question Type 7 — Highlight Incorrect Words

### What It Is
Written transcript shown on screen. Audio plays. Some words in transcript deliberately differ from what audio says. Student clicks words they think are wrong.

### Admin Setup
- Navigate: Admin Panel → Listening → Highlight Incorrect Words → Add Question
- Fields:
  - **Audio file**
  - **Play limit**
  - **Transcript text** — the version shown to student (intentionally has some words changed)
  - **Mark incorrect words** — in admin UI, click each word that differs from audio. System stores their positions as word indices array.

**Example:**
````
Audio says:       "The small city was abandoned centuries ago"
Transcript shows: "The large city was abandoned decades ago"
Incorrect word indices: [1, 5]  ← "large" (index 1) and "decades" (index 5)
````

### Student Flow
1. Audio plays. Full transcript shown as individual clickable word spans.
2. Student listens and clicks words they think differ from audio.
3. Clicked words highlighted. Can click again to deselect.
4. Submits. Each word revealed: correct click, wrong click, or missed.

### Developer — Frontend
- Render transcript as array of `<span>` elements — one per word
- Each span toggles selected state on click
- Track clicked word indices in state array
- On submit: `POST /api/listening/evaluate` with `{ questionId, questionType: 'highlight_incorrect', clickedIndices: [1, 4, 5] }`

### Developer — Backend
- Fetch `incorrectWordIndices` array from DB
- For each clicked index: check against incorrectWordIndices
- Apply negative marking
- No new package needed — pure array comparison

### Scoring — Negative Marking
````
Clicked + in incorrectWordIndices     → +1 point
Clicked + NOT in incorrectWordIndices → -1 point  (wrong click)
Not clicked                           →  0 points

Score = max(0, total) / incorrectWordIndices.length × 100

Example:
incorrectWordIndices = [2, 6, 9, 14]  (4 incorrect words)
Student clicked: [2, 5, 6, 9, 12]

  Index 2:  incorrect + clicked  → +1
  Index 5:  correct   + clicked  → -1
  Index 6:  incorrect + clicked  → +1
  Index 9:  incorrect + clicked  → +1
  Index 12: correct   + clicked  → -1
  Index 14: incorrect + missed   →  0

Total = 1 / 4 × 100 = 25%
````

### Result Display
````
Word 'large'   → ✓ Correct click  (audio said 'small')
Word 'quickly' → ✗ Wrong click    (this word matched audio)
Word 'blue'    → ✓ Correct click  (audio said 'red')
Word 'ancient' → ! Missed         (audio said 'modern')
Score: 1/4 → 25%
````

---

## Question Type 8 — Write from Dictation

### What It Is
A short sentence (10–20 words) played as audio. Student types exactly what they heard word for word. Tests both listening accuracy and spelling simultaneously.

### Admin Setup
- Navigate: Admin Panel → Listening → Write from Dictation → Add Question
- Fields:
  - **Audio file** — short sentence recording
  - **Play limit** (once or unlimited)
  - **Correct sentence** — exact text of what is spoken in the audio (used for scoring)

### Student Flow
1. Audio plays. Short sentence spoken.
2. Single text input shown. Student types what they heard.
3. Can replay if play limit allows.
4. Submits. Word-by-word comparison shown. Correct sentence revealed.

### Developer — Frontend
- Single `<input>` or `<textarea>` for response
- On submit: `POST /api/listening/evaluate` with `{ questionId, questionType: 'write_dictation', answer: 'The sientists discoverd a new spesies last year' }`

### Developer — Backend
- Package: `fastest-levenshtein` (same as Fill in the Blanks — already installed)
- Split correct sentence into word array
- Split student response into word array
- For each correct word: find best match in student array within edit distance ≤ 2
- Track exact matches vs fuzzy matches separately
- Calculate two-part score

### Scoring — Fuzzy Word Match + Spelling
````
Two-part score:

Word Match (70%):
  For each word in correct sentence: check if student typed it (exact or fuzzy ≤ 2)
  wordMatchScore = matched words / total words × 100

Spelling (30%):
  Of all words: count only exact matches
  spellingScore = exact matches / total words × 100

Final = (wordMatchScore × 0.70) + (spellingScore × 0.30)

Example:
Correct:  "The scientists discovered a new species last year"  (8 words)
Student:  "The sientists discoverd a new spesies last year"

Word match:  8/8 found (3 fuzzy)     → 100%
Spelling:    5 exact / 8 total       → 63%
Final = (100 × 0.70) + (63 × 0.30) = 70 + 18.9 = 88.9% → ~80 / 90
````

### Result Display
````
The        ✓ Exact
sientists  ~ Close  (scientists)
discoverd  ~ Close  (discovered)
a          ✓ Exact
new        ✓ Exact
spesies    ~ Close  (species)
last       ✓ Exact
year       ✓ Exact

Correct sentence: "The scientists discovered a new species last year"
Your Score: 89% → 80 / 90
````

---

## Database Schema — Listening Module

### Listening Questions Collection (`listening_questions`)

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated |
| type | String | summarise_spoken \| mcq_multiple \| fill_blanks \| highlight_summary \| mcq_single \| select_missing \| highlight_incorrect \| write_dictation |
| audioUrl | String | Cloudinary URL of uploaded audio file |
| playLimit | Integer | 1 = play once. 0 = unlimited replays |
| question | String | Question text — MCQ types only. Null for others. |
| options | Array | MCQ + summary types: `[{ label, text, isCorrect }]` |
| transcript | String | Full transcript — fill_blanks and highlight_incorrect only |
| blanks | Array | fill_blanks only: `[{ position, correctWord }]` |
| incorrectWordIndices | Array | highlight_incorrect only: `[2, 6, 9, 14]` |
| correctSentence | String | write_dictation only: exact correct sentence |
| isActive | Boolean | Controls visibility to students |
| createdAt | Timestamp | Auto-set |
| attemptCount | Integer | Incremented per submission |
| avgScore | Float | Rolling average — updated per submission |

---

## API Routes — Listening Module

### Student Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/listening/:type/:id | Fetch one question by type and ID |
| GET | /api/listening/:type/random | Fetch random question of given type |
| POST | /api/listening/evaluate | Submit answer for any listening question type |

### Admin Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/admin/listening/questions | List all questions with filters |
| POST | /api/admin/listening/questions | Add new question (with audio upload) |
| PUT | /api/admin/listening/questions/:id | Edit question |
| DELETE | /api/admin/listening/questions/:id | Delete question + remove Cloudinary file |
| PATCH | /api/admin/listening/questions/:id/status | Toggle active/inactive |

### Evaluate Endpoint — Request Format

```json
{
  "questionId": "abc123",
  "questionType": "fill_blanks",
  "answers": ["population", "economic"]
}
```

`questionType` values:
`summarise_spoken` | `mcq_multiple` | `fill_blanks` | `highlight_summary` | `mcq_single` | `select_missing` | `highlight_incorrect` | `write_dictation`

---

## Score Response Format

```json
{
  "finalScore": 88.9,
  "displayScore": "80 / 90",
  "feedback": "Good listening accuracy. A few spelling errors detected.",
  "breakdown": {
    "wordMatch": { "score": 100, "matched": 8, "total": 8 },
    "spelling": { "score": 63, "exact": 5, "total": 8 }
  },
  "correctAnswer": "The scientists discovered a new species last year"
}
```

---

## Shared Code — Reuse Rules

| Function / Package | Used By |
|---|---|
| Writing `checkSpelling()` | Summarise Spoken Text |
| Writing word count scoring | Summarise Spoken Text |
| Reading MCQ Multiple scoring | MCQ Multiple Answers |
| Reading MCQ Single scoring | Highlight Correct Summary, MCQ Single, Select Missing Word |
| `fastest-levenshtein` package | Fill in the Blanks + Write from Dictation |

---

## Key Rules — Must Follow While Building

- Admin uploads all audio. Platform only plays it. No server-side audio processing.
- All correct answers entered manually by admin. No audio-to-text conversion.
- 5 of 8 scoring functions reused directly — do not rewrite them.
- Only one new npm package: `fastest-levenshtein` — handles both Fill Blanks and Write Dictation.
- All 8 types share one evaluate endpoint — routed by `questionType` field.
- Audio deleted from Cloudinary when admin deletes a question.
- No per-attempt records. Only `attemptCount` and `avgScore` updated on question document.
- Scores out of 90. `displayScore = finalPercent × 90`.
- No difficulty field stored — removed from this platform.
- Highlight Incorrect Words stores word indices as integer array — not word strings.
- Write from Dictation tracks exact vs fuzzy matches separately for two-part score.
