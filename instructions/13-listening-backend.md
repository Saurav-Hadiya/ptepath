# 13 — Listening Backend

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/13-listening-backend.md and implement exactly what is described."

---

## What to Build
Complete listening module backend including:
- Question schema and CRUD for admin (with audio file upload)
- Scoring logic for all 8 question types
- Single evaluate endpoint routing to correct scoring function
- Reuse of existing scoring functions from writing and reading modules

---

## Reference Docs
- `docs/md/listening-module.md` — complete scoring logic, DB schema, API routes
- `docs/md/writing-module.md` — checkSpelling function to reuse
- `docs/md/reading-module.md` — MCQ scoring functions to reuse
- `instructions/06-project-structure.md` — file locations

---

## Prerequisites
- `07-authentication-backend.md` complete
- `10-writing-backend.md` complete (checkSpelling utility needed)
- `11-reading-backend.md` complete (MCQ scoring functions needed)
- authenticate and authorize middleware working
- Cloudinary configured
- uploadAudio multer middleware working
- fastest-levenshtein package installed

---

## Files to Implement

### 1. `src/models/listening-question.model.ts`

Mongoose schema with these exact fields:

| Field | Type | Details |
|---|---|---|
| type | String | required, enum: ['summarise_spoken', 'mcq_multiple', 'fill_blanks', 'highlight_summary', 'mcq_single', 'select_missing', 'highlight_incorrect', 'write_dictation'] |
| audioUrl | String | required — Cloudinary URL of uploaded audio file |
| audioPublicId | String | required — Cloudinary public ID for deletion |
| playLimit | Number | default: 1 — 1=play once, 0=unlimited |
| question | String | default: null — question text for MCQ types only |
| options | Array | MCQ + summary types: `[{ label: String, text: String, isCorrect: Boolean }]` |
| transcript | String | default: null — fill_blanks and highlight_incorrect only |
| blanks | Array | fill_blanks only: `[{ position: Number, correctWord: String }]` |
| incorrectWordIndices | [Number] | highlight_incorrect only — word position indices |
| correctSentence | String | default: null — write_dictation only |
| isActive | Boolean | default: true |
| createdAt | Date | default: Date.now |
| attemptCount | Number | default: 0 |
| avgScore | Number | default: 0 |

Export as `ListeningQuestion` model.

---

### 2. `src/scoring/listening.scoring.ts`

Import and reuse:
- `checkSpelling` from `src/scoring/writing.scoring.ts`
- `calculateWordCountScore` from `src/scoring/writing.scoring.ts`
- `scoreMCQMultiple` from `src/scoring/reading.scoring.ts`
- `scoreMCQSingle` from `src/scoring/reading.scoring.ts`

Import from fastest-levenshtein:
````
import { distance } from 'fastest-levenshtein'
````

---

**`scoreSummariseSpoken(responseText)`**

Reuses writing scoring functions directly:
````
wordCount = countWords(responseText)

Word count scoring for summarise spoken:
wordCount 0-29   → wordCountScore = 0
wordCount 30-49  → wordCountScore = 60
wordCount 50-70  → wordCountScore = 100
wordCount 71-85  → wordCountScore = 50
wordCount 86+    → wordCountScore = 0

spellingResult = checkSpelling(responseText)
spellingScore = spellingResult.score

finalScore = (wordCountScore × 0.50) + (spellingScore × 0.50)
displayScore = Math.round(finalScore × 0.90) + ' / 90'

Return full score object with misspelledWords
````

---

**`scoreFillBlanksListening(studentAnswers, blanks)`**

Listening fill blanks uses fuzzy matching — student types under audio pressure.

````
blanks = array from DB: [{ position, correctWord }]
studentAnswers = string array — one per blank

For each blank (index i):
  studentWord = studentAnswers[i].toLowerCase().trim()
  correctWord = blanks[i].correctWord.toLowerCase().trim()
  d = distance(studentWord, correctWord)

  if d = 0   → points = 1.0  (exact match)
  if d = 1   → points = 0.7  (minor typo)
  if d = 2   → points = 0.4  (acceptable under pressure)
  if d > 2   → points = 0.0  (wrong)

totalPoints = sum of all points
score = (totalPoints / blanks.length) × 100

Return:
{
  score: number
  totalPoints: number
  totalBlanks: number
  breakdown: Array<{
    blank: number
    studentAnswer: string
    correctAnswer: string
    distance: number
    points: number
    result: 'exact' | 'close' | 'wrong'
  }>
}
````

Result classification:
- distance 0 → 'exact'
- distance 1-2 → 'close'
- distance > 2 → 'wrong'

---

**`scoreHighlightIncorrect(clickedIndices, incorrectWordIndices)`**

````
clickedIndices = number array — word indices student clicked
incorrectWordIndices = number array from DB

For each clicked index:
  If in incorrectWordIndices → points +1
  If NOT in incorrectWordIndices → points -1  (wrong click)

For each incorrectWordIndex NOT clicked → points 0 (missed)

totalPoints = sum
score = max(0, totalPoints) / incorrectWordIndices.length × 100

Return:
{
  score: number
  totalPoints: number
  totalIncorrect: number
  wordResults: Array<{
    index: number
    clicked: boolean
    isIncorrect: boolean
    result: 'correct_click' | 'wrong_click' | 'missed' | 'neutral'
  }>
}
````

Result classification:
- clicked + isIncorrect → 'correct_click'
- clicked + not isIncorrect → 'wrong_click'
- not clicked + isIncorrect → 'missed'
- not clicked + not isIncorrect → 'neutral'

---

**`scoreWriteDictation(studentText, correctSentence)`**

Two-part scoring: word match (70%) + spelling accuracy (30%)

````
correctWords = correctSentence.toLowerCase().trim().split(/\s+/)
studentWords = studentText.toLowerCase().trim().split(/\s+/)

Word match scoring:
For each word in correctWords:
  Find best match in studentWords within edit distance ≤ 2
  If found: matchedWords +1
    If exact match (distance 0): exactMatches +1

wordMatchScore = (matchedWords / correctWords.length) × 100
spellingScore = (exactMatches / correctWords.length) × 100

finalScore = (wordMatchScore × 0.70) + (spellingScore × 0.30)
displayScore = Math.round(finalScore × 0.90) + ' / 90'

Build word-level breakdown:
For each correct word: find what student wrote and its match type

Return:
{
  finalScore: number
  displayScore: string
  wordMatchScore: number
  spellingScore: number
  matchedWords: number
  exactMatches: number
  totalWords: number
  correctSentence: string
  breakdown: Array<{
    correctWord: string
    studentWord: string | null
    distance: number
    result: 'exact' | 'close' | 'missed'
  }>
}
````

---

**`calculateListeningScore(questionType, studentAnswer, question)`**

Single entry point routing to correct scoring function:

````
switch questionType:

  'summarise_spoken':
    return scoreSummariseSpoken(studentAnswer)

  'mcq_multiple':
    return scoreMCQMultiple(studentAnswer, question.options)
    — reused from reading.scoring.ts

  'fill_blanks':
    return scoreFillBlanksListening(studentAnswer, question.blanks)

  'highlight_summary':
    return scoreMCQSingle(studentAnswer, question.options)
    — reused from reading.scoring.ts

  'mcq_single':
    return scoreMCQSingle(studentAnswer, question.options)
    — reused from reading.scoring.ts

  'select_missing':
    return scoreMCQSingle(studentAnswer, question.options)
    — reused from reading.scoring.ts

  'highlight_incorrect':
    return scoreHighlightIncorrect(studentAnswer, question.incorrectWordIndices)

  'write_dictation':
    return scoreWriteDictation(studentAnswer, question.correctSentence)
````

Each result also gets:
````
displayScore = Math.round(score × 0.90) + ' / 90'
feedback = generateListeningFeedback(score, questionType)
````

---

**`generateListeningFeedback(score, questionType)`**

````
score >= 80 → 'Excellent listening accuracy!'
score 60-79 → 'Good attempt. Listen carefully to each word.'
score 40-59 → 'Keep practising. Focus on key words while listening.'
score < 40  → 'Needs improvement. Try to listen for the main ideas first.'
````

---

### 3. `src/controllers/listening.controller.ts`

---

**Admin Controllers:**

`addQuestion` — POST /api/admin/listening/questions
````
1. Audio file required — from req.file (multer + Cloudinary upload)
2. Get type + playLimit + question + options + transcript
   + blanks + incorrectWordIndices + correctSentence from req.body
3. Validate audio file uploaded
4. Validate required fields per type:
   - All types: type required, audio required
   - summarise_spoken: no extra fields needed
   - mcq_multiple: question + options[] (min 2, min 1 correct)
   - fill_blanks: transcript + blanks[] (min 1 blank with correctWord)
   - highlight_summary: options[] (3-4 options, exactly 1 correct)
   - mcq_single: question + options[] (min 2, exactly 1 correct)
   - select_missing: options[] (min 2, exactly 1 correct)
   - highlight_incorrect: transcript + incorrectWordIndices[] (min 1)
   - write_dictation: correctSentence required
5. Parse JSON strings from req.body if needed
   (multipart form data sends arrays as strings)
6. Create ListeningQuestion with:
   audioUrl = req.file.path (Cloudinary URL)
   audioPublicId = req.file.filename (Cloudinary public ID)
7. Save and return 201 { success: true, data: { question } }
````

`getAllQuestions` — GET /api/admin/listening/questions
````
1. Get type from query params (optional filter)
2. Find questions matching filter, sort createdAt desc
3. Return 200 { success: true, data: { questions, total } }
````

`getOneQuestion` — GET /api/admin/listening/questions/:id
````
1. Find question by id
2. If not found → 404
3. Return full question data
````

`updateQuestion` — PUT /api/admin/listening/questions/:id
````
1. Find question by id
2. If not found → 404
3. If new audio file uploaded (req.file exists):
   Delete old audio from Cloudinary using audioPublicId
   Update audioUrl and audioPublicId with new file
4. Update allowed fields: question, options, transcript,
   blanks, incorrectWordIndices, correctSentence, playLimit
5. Do not allow changing type
6. Save and return updated question
````

`deleteQuestion` — DELETE /api/admin/listening/questions/:id
````
1. Find question by id
2. If not found → 404
3. Delete audio file from Cloudinary using audioPublicId
   resource_type: 'video' (Cloudinary uses this for audio)
4. Delete question document
5. Return 200 { success: true, message: 'Question deleted.' }
````

`toggleStatus` — PATCH /api/admin/listening/questions/:id/status
````
1. Find question by id
2. Set isActive to provided boolean
3. Save and return 200
````

---

**Student Controllers:**

`getQuestion` — GET /api/listening/:type/:id
````
1. Validate type is valid enum
2. Find active question by id and type
3. If not found → 404
4. Strip correct answers before sending:
   - options: remove isCorrect field
   - blanks: remove correctWord field
   - incorrectWordIndices: DO NOT send (student must find them)
   - correctSentence: DO NOT send
5. Return safe question data including audioUrl and playLimit
````

`getRandomQuestion` — GET /api/listening/:type/random
````
1. Find all active questions of given type
2. Pick one randomly
3. Return same shape as getQuestion (strip correct answers)
````

`evaluate` — POST /api/listening/evaluate
````
1. Get questionId + questionType + answer from req.body
2. Validate all required
3. Find question by id and type — include all fields
4. If not found → 404
5. Call calculateListeningScore(questionType, answer, question)
6. Update question stats (attemptCount + avgScore rolling average)
7. Update student stats (totalAttempts + lastActiveAt)
8. Return 200 with full score result
   — correct answers NOW revealed in response
9. Student answer text/indices: not stored anywhere
````

---

**Rolling Average Update:**
````
question.attemptCount += 1
question.avgScore = ((question.avgScore × (question.attemptCount - 1)) + finalScore) / question.attemptCount
await question.save()
````

**Student Stats Update:**
````
await User.findByIdAndUpdate(req.user.userId, {
  $inc: { totalAttempts: 1 },
  lastActiveAt: new Date()
})
````

---

### 4. `src/routes/listening.routes.ts`

**Admin routes** — require authenticate + authorize('admin'):
````
POST   /api/admin/listening/questions             → uploadAudio, addQuestion
GET    /api/admin/listening/questions             → getAllQuestions
GET    /api/admin/listening/questions/:id         → getOneQuestion
PUT    /api/admin/listening/questions/:id         → uploadAudio, updateQuestion
DELETE /api/admin/listening/questions/:id         → deleteQuestion
PATCH  /api/admin/listening/questions/:id/status  → toggleStatus
````

**Student routes** — require authenticate:
````
GET    /api/listening/:type/:id                   → getQuestion
GET    /api/listening/:type/random                → getRandomQuestion
POST   /api/listening/evaluate                    → evaluate
````

---

## Evaluate Request Format

```json
{
  "questionId": "abc123",
  "questionType": "fill_blanks",
  "answer": ["population", "economic"]
}
```

`answer` format per question type:
| Type | answer format |
|---|---|
| summarise_spoken | `"string"` — written summary text |
| mcq_multiple | `["A", "C"]` — selected labels array |
| fill_blanks | `["word1", "word2"]` — typed words array |
| highlight_summary | `"B"` — selected label string |
| mcq_single | `"B"` — selected label string |
| select_missing | `"C"` — selected label string |
| highlight_incorrect | `[2, 5, 9]` — clicked word indices array |
| write_dictation | `"string"` — typed sentence text |

---

## Cloudinary Audio Upload Notes

For admin audio upload use `uploadAudio` multer middleware from
`src/middleware/upload.ts`.

Cloudinary stores audio as resource_type 'video'.
When deleting: must specify `resource_type: 'video'` in destroy call.

````
await cloudinary.uploader.destroy(audioPublicId, {
  resource_type: 'video'
})
````

For images (speaking module): resource_type is 'image'.
For audio (listening module): resource_type is 'video'.

---

## Score Response Format

Write from Dictation example:
```json
{
  "success": true,
  "data": {
    "questionType": "write_dictation",
    "finalScore": 88.9,
    "displayScore": "80 / 90",
    "feedback": "Good listening accuracy!",
    "wordMatchScore": 100,
    "spellingScore": 62.5,
    "matchedWords": 8,
    "exactMatches": 5,
    "totalWords": 8,
    "correctSentence": "The scientists discovered a new species last year",
    "breakdown": [
      { "correctWord": "The", "studentWord": "The", "distance": 0, "result": "exact" },
      { "correctWord": "scientists", "studentWord": "sientists", "distance": 1, "result": "close" },
      { "correctWord": "discovered", "studentWord": "discoverd", "distance": 1, "result": "close" }
    ]
  }
}
```

---

## Expected Output When Done
- Admin can upload audio and create all 8 question types
- Audio stored on Cloudinary, deleted when question deleted
- Students fetch questions without seeing correct answers
- Single evaluate endpoint routes correctly to all 8 scoring functions
- 5 types reuse reading/writing scoring functions
- Fill blanks uses fuzzy matching with partial credit
- Highlight incorrect uses negative marking on word indices
- Write dictation uses two-part score (word match + spelling)
- Question and student stats updated on every submission

---

## Verification Steps
1. POST /api/admin/listening/questions (write_dictation with audio) → created
2. GET /api/listening/write_dictation/:id → correctSentence NOT in response
3. POST /api/listening/evaluate (write_dictation, perfect answer) → score ~90/90
4. POST /api/listening/evaluate (write_dictation, with typos) → partial score
5. POST /api/listening/evaluate (highlight_incorrect, all correct clicks) → 100%
6. POST /api/listening/evaluate (highlight_incorrect, wrong clicks) → negative marking works
7. POST /api/listening/evaluate (fill_blanks, minor typo) → partial credit 0.7
8. DELETE /api/admin/listening/questions/:id → audio deleted from Cloudinary
9. Check MongoDB → stats updated correctly

---

## Notes
- calculateListeningScore() is the single entry point for all 8 types
- 5 of 8 scoring functions are direct imports from reading/writing modules
- Only 3 new functions: scoreFillBlanksListening, scoreHighlightIncorrect, scoreWriteDictation
- Audio resource_type in Cloudinary is 'video' — not a mistake
- incorrectWordIndices and correctSentence never sent to student before submission
- No difficulty field anywhere — removed from this platform
- Student answer text/indices never stored in DB
- fastest-levenshtein used for fill_blanks and write_dictation

## Next Step
→ Give Claude Code `14-mocktest-backend.md`
