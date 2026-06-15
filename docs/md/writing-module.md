
# Writing Module — Complete Blueprint

## Overview

**Platform:** PTEPath — PTE Exam Practice Platform
**Module:** Writing
**Question Types:** 2
**Scoring:** Rule-based only. No AI. No paid services.
**Scoring Packages:** nspell + dictionary-en (both free npm packages)

---

## Tech Stack — Writing Module

| Concern | Decision | Tool | Cost |
|---|---|---|---|
| Word counting | Frontend + Backend | Plain JavaScript | Free |
| Word limit enforcement | Frontend | onChange handler | Free |
| Spell checking | Backend | nspell + dictionary-en | Free |
| Timer | Frontend | setInterval | Free |
| Response storage | Not stored | Discarded after scoring | Free |
| Score storage | MongoDB Atlas | Lightweight record only | Free tier |
| Backend hosting | Render free tier | nspell is lightweight | Free |

---

## Universal Flow — Both Question Types

````
ADMIN    → Adds question data in Admin Panel
STUDENT  → Reads question, types response in text area
FRONTEND → Live word counter shown. Student cannot exceed word limit.
STUDENT  → Clicks Submit (only enabled when within valid word range)
FRONTEND → Sends typed text + question ID to backend
BACKEND  → Counts words → calculates word count score
BACKEND  → Runs nspell on each word → calculates spelling score
BACKEND  → Combines both scores → returns score object
FRONTEND → Displays score breakdown to student
STORAGE  → Student response text NOT stored — score record only saved
````

---

## Scoring — Both Question Types

Two criteria only. Same for both question types.

| Criterion | Weight | Method | Package |
|---|---|---|---|
| Word Count Compliance | 50% | Count words. Score based on range compliance. | Plain JavaScript |
| Spelling Accuracy | 50% | Correctly spelled words ÷ total words × 100 | nspell + dictionary-en |

### nspell Setup Rule

Initialise nspell **once at server start**. Store instance in memory.
Reuse for every request. Never re-initialise per request.

````
Server starts
      ↓
Load nspell + dictionary-en → create instance
      ↓
Store as module-level variable
      ↓
All requests call checkSpelling(text) using this instance
````

### checkSpelling Function — Shared Utility

Single function used by both question types.

````
Input:  raw response text string
Steps:
  1. Convert to lowercase
  2. Remove punctuation from around words
  3. Split into word array
  4. For each word: call nspell.correct(word)
  5. Count total words and correctly spelled words
Output: { total: number, correct: number, score: number }
````

---

## Word Counter — Frontend Behaviour

Live counter shown inside textarea. Updates on every keystroke.

| Counter State | Colour | Example Display | Submit Button |
|---|---|---|---|
| Below minimum | Grey | 3 / 75 words | Disabled |
| Within valid range | Green | 45 / 75 words | Enabled |
| At maximum limit | Red | 75 / 75 words | Enabled — no more input |

**Enforcement rule:**
On every `onChange` event — count words. If word count reaches maximum, trim input back to last valid word boundary. Student can still delete words but cannot add more.

---

## Question Type 1 — Summarise Written Text

### What It Is
A passage (200–300 words) is shown. Student writes ONE sentence summarising the main idea. Must be 5 to 75 words. Time limit: 10 minutes.

### Admin Setup
- Navigate: Admin Panel → Writing → Summarise Written Text → Add Question
- Fields:
  - **Passage text** (200–300 words, plain text)
  - **Time limit** (default: 10 minutes)
- No model answer. No keywords. No file upload.

### Student Flow
1. Passage shown on screen
2. 10-minute countdown timer starts and stays visible
3. Textarea shown with word counter: "0 / 75 words" in grey
4. Student types summary. Counter updates live. Turns green at 5+ words.
5. At 75 words: textarea blocks further input. Counter turns red.
6. Submit enabled at 5+ words. Auto-submit when timer reaches zero.
7. "Checking your response..." shown briefly (1–2 seconds)
8. Score screen shown with word count score, spelling score, feedback, misspelled words list

### Developer — Frontend
- Fetch: `GET /api/writing/summarise/:questionId`
- Response: `{ passageText, timeLimit, wordMin: 5, wordMax: 75 }`
- Render passage in scrollable read-only area
- Render textarea with live word counter
- `setInterval` countdown timer — auto-submit on zero if wordCount ≥ 5
- On onChange: count words → update counter colour → block at 75
- Disable Submit if wordCount < 5
- On submit: `POST /api/writing/evaluate/summarise` with `{ questionId, responseText }`
- Show loading → render score breakdown

### Developer — Backend
- Route: `POST /api/writing/evaluate/summarise`
- Receive `{ questionId, responseText }`
- Validate: responseText must be non-empty string
- Run word count scoring (see scoring logic below)
- Run spelling check using shared `checkSpelling(responseText)` function
- Calculate final score: `(wordCountScore × 0.50) + (spellingScore × 0.50)`
- Generate feedback string
- Return score JSON
- Do NOT store responseText

### Word Count Scoring — Summarise Written Text

| Word Count | Score | Reason |
|---|---|---|
| 0 to 4 | 0% | Too short — invalid attempt |
| 5 to 75 | 100% | Within valid range — full score |
| 76 to 90 | 50% | Slightly over (frontend blocks this — backend safety check) |
| 91+ | 0% | Far over limit |

---

## Question Type 2 — Write Essay

### What It Is
An essay prompt is shown. Student writes a full essay. Must be 200 to 300 words. Time limit: 20 minutes.

### Admin Setup
- Navigate: Admin Panel → Writing → Write Essay → Add Question
- Fields:
  - **Essay prompt** (the topic or question student must write about)
  - **Time limit** (default: 20 minutes)
- No model essay. No keywords.

### Student Flow
1. Essay prompt shown at top of screen
2. 20-minute countdown timer starts
3. Large textarea shown with word counter: "0 / 300 words" in grey
4. Counter turns yellow at 100 words, green at 200 words (minimum for full score)
5. At 300 words: textarea blocks further input. Counter turns red.
6. Submit enabled at 100+ words (allows partial attempt). Auto-submit on timer zero.
7. "Checking your response..." shown briefly
8. Score screen shown

### Developer — Frontend
- Fetch: `GET /api/writing/essay/:questionId`
- Response: `{ promptText, timeLimit, wordMin: 200, wordMax: 300 }`
- Render prompt at top. Render large textarea.
- Counter colour states: grey (0–99), yellow (100–199), green (200–300), red (at 300)
- Disable Submit if wordCount < 100
- Auto-submit on timer zero if wordCount ≥ 100
- On submit: `POST /api/writing/evaluate/essay` with `{ questionId, responseText }`

### Developer — Backend
- Route: `POST /api/writing/evaluate/essay`
- Identical processing to Summarise Written Text
- Call same `checkSpelling(responseText)` shared function
- Apply essay-specific word count scoring (see below)
- Return score JSON. Do not store responseText.

### Word Count Scoring — Write Essay

| Word Count | Score | Reason |
|---|---|---|
| 0 to 99 | 0% | Far too short |
| 100 to 149 | 25% | Very short — significant effort but below requirement |
| 150 to 199 | 60% | Below minimum but reasonable attempt |
| 200 to 300 | 100% | Within valid range — full score |
| 301 to 320 | 50% | Slightly over (frontend blocks — backend safety check) |
| 321+ | 0% | Far over limit |

---

## Database Schema — Writing Module

### Writing Questions Collection (`writing_questions`)

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated |
| type | String | summarise_written_text \| write_essay |
| content | String | Passage text (SWT) or essay prompt (WE) |
| timeLimit | Integer | Seconds. SWT default: 600. WE default: 1200. |
| wordMin | Integer | SWT: 5. WE: 200. |
| wordMax | Integer | SWT: 75. WE: 300. |
| isActive | Boolean | Controls visibility to students |
| createdAt | Timestamp | Auto-set |
| attemptCount | Integer | Incremented per submission |
| avgScore | Float | Rolling average — updated per submission |

### Storage Rule — No Per-Attempt Records

No individual attempt records stored.
On every submission, update only:
- `attemptCount` → increment by 1
- `avgScore` → rolling average: `((currentAvg × currentCount) + newScore) / (currentCount + 1)`

On student document:
- `totalAttempts` → increment by 1
- `lastActiveAt` → current timestamp

Student `responseText` → discarded immediately after scoring. Never stored.

---

## API Routes — Writing Module

### Student Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/writing/summarise/:id | Fetch one SWT question |
| GET | /api/writing/summarise/random | Fetch random SWT question |
| POST | /api/writing/evaluate/summarise | Submit SWT response for scoring |
| GET | /api/writing/essay/:id | Fetch one essay question |
| GET | /api/writing/essay/random | Fetch random essay question |
| POST | /api/writing/evaluate/essay | Submit essay response for scoring |

### Admin Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/admin/writing/questions | List all questions |
| POST | /api/admin/writing/questions | Add new question |
| PUT | /api/admin/writing/questions/:id | Edit question |
| DELETE | /api/admin/writing/questions/:id | Delete question |
| PATCH | /api/admin/writing/questions/:id/status | Toggle active/inactive |

---

## Score Response Format

```json
{
  "wordCount": 52,
  "wordCountScore": 100,
  "spellingScore": 87,
  "finalScore": 93.5,
  "displayScore": "84 / 90",
  "feedback": "Good response length. Some spelling errors were detected.",
  "misspelledWords": ["goverment", "enviromental"],
  "breakdown": {
    "wordCount": { "score": 100, "actual": 52, "min": 5, "max": 75 },
    "spelling": { "score": 87, "correct": 47, "total": 54 }
  }
}
```

---

## Misspelled Words Display Rule

- Show up to 5 misspelled words below the score
- If more than 5: show 5 and add "+N more"
- Example: `'goverment', 'enviromental' — check your spelling of these words.`

---

## Feedback Messages

| Condition | Message |
|---|---|
| Word count below minimum | Your response is too short. Please write at least the minimum required words. |
| Word count above maximum | Your response exceeds the word limit. Please shorten it. |
| Spelling score below 60% | Several spelling errors were found. Review your spelling carefully. |
| Spelling score 60–80% | Some spelling errors detected. Proofread before submitting. |
| Word count good, spelling low | Good word count but spelling needs attention. |
| Both criteria above 85% | Well done! Your response length and spelling are both strong. |

---

## Timer Behaviour

| Scenario | What Happens |
|---|---|
| Submit before timer ends | Processed immediately. Timer stops. Score shown. |
| Timer zero, enough words | Auto-submitted. "Time is up — your response has been submitted." shown. |
| Timer zero, response too short | Auto-submitted. Low word count score reflects this. |
| Page refresh during attempt | Timer and response lost. Student starts again. Acceptable for practice platform. |
| Browser closed | Attempt abandoned. No partial save. |

---

## Key Rules — Must Follow While Building

- Scoring runs on server only. Frontend enforces word limits and displays results.
- nspell initialised once at server start — never per request.
- `checkSpelling()` is one shared function used by both question types.
- Student response text never stored. Score record only.
- Word limit enforced on frontend AND validated on backend as safety check.
- Submit disabled below minimum word threshold.
- Misspelled words returned in API response and shown to student.
- Timer auto-submits on expiry — nothing lost silently.
- Scores out of 90. `displayScore = finalPercent × 90`.
- No difficulty field. Removed from this platform.
- No grammar scoring. No content scoring. Word count + spelling only.
